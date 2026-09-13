import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingStatus, ContentStatus } from '../common/enums';
import {
  Availability,
  Booking,
  Hotel,
  RateCalendar,
  RatePlan,
  RoomType,
} from '../entities';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Hotel)
    private readonly hotelsRepo: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomsRepo: Repository<RoomType>,
    @InjectRepository(RatePlan)
    private readonly ratesRepo: Repository<RatePlan>,
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
    @InjectRepository(RateCalendar)
    private readonly rateCalendarRepo: Repository<RateCalendar>,
    private readonly mail: MailService,
  ) {}

  private parseLocal(date: string) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y!, (m ?? 1) - 1, d ?? 1);
  }

  private toYmd(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private nights(checkIn: string, checkOut: string) {
    const start = this.parseLocal(checkIn);
    const end = this.parseLocal(checkOut);
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }

  private eachNight(checkIn: string, checkOut: string) {
    const nights: string[] = [];
    const cursor = this.parseLocal(checkIn);
    const end = this.parseLocal(checkOut);
    while (cursor < end) {
      nights.push(this.toYmd(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return nights;
  }

  private assertDates(checkIn: string, checkOut: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = this.parseLocal(checkIn);
    const end = this.parseLocal(checkOut);
    if (!(start >= today && end > start)) {
      throw new BadRequestException('Invalid check-in / check-out dates');
    }
  }

  private async unitsForNight(room: RoomType, date: string) {
    const row = await this.availabilityRepo.findOne({
      where: { roomTypeId: room.id, date },
    });
    if (row?.stopSell) return 0;
    if (row) return row.availableUnits;
    return room.baseInventory;
  }

  private async bookedOnNight(roomTypeId: string, date: string) {
    const next = this.parseLocal(date);
    next.setDate(next.getDate() + 1);
    const nextYmd = this.toYmd(next);
    const overlapping = await this.bookingsRepo
      .createQueryBuilder('b')
      .where('b.room_type_id = :roomTypeId', { roomTypeId })
      .andWhere('b.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .andWhere('b.check_in < :next AND b.check_out > :date', {
        date,
        next: nextYmd,
      })
      .getMany();
    return overlapping.reduce((sum, b) => sum + b.rooms, 0);
  }

  async search(params: {
    locationSlug?: string;
    hotelSlug?: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
  }) {
    this.assertDates(params.checkIn, params.checkOut);
    const nights = this.nights(params.checkIn, params.checkOut);
    const nightDates = this.eachNight(params.checkIn, params.checkOut);
    if (nights < 1 || !nightDates.length) return [];

    const hotelsQb = this.hotelsRepo
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.location', 'location')
      .where('hotel.status = :status', { status: ContentStatus.PUBLISHED });

    if (params.hotelSlug) {
      hotelsQb.andWhere('hotel.slug = :slug', { slug: params.hotelSlug });
    } else if (params.locationSlug) {
      hotelsQb.andWhere('location.slug = :locationSlug', {
        locationSlug: params.locationSlug,
      });
    }

    const hotels = await hotelsQb.getMany();
    const results = [];

    for (const hotel of hotels) {
      const rooms = await this.roomsRepo.find({
        where: { hotelId: hotel.id, status: ContentStatus.PUBLISHED },
      });
      for (const room of rooms) {
        const guests = params.adults + params.children;
        if (
          params.adults > room.maxAdults ||
          params.children > room.maxChildren ||
          guests > room.maxGuests
        ) {
          continue;
        }

        const plans = await this.ratesRepo.find({
          where: { roomTypeId: room.id, status: ContentStatus.PUBLISHED },
        });

        for (const plan of plans) {
          let blocked = false;
          let availableUnits = Number.POSITIVE_INFINITY;
          let nightTotal = 0;

          const calendars = await this.rateCalendarRepo.find({
            where: { ratePlanId: plan.id, date: In(nightDates) },
          });
          const calByDate = Object.fromEntries(
            calendars.map((c) => [c.date, c]),
          );

          for (const date of nightDates) {
            const free =
              (await this.unitsForNight(room, date)) -
              (await this.bookedOnNight(room.id, date));
            if (free < params.rooms) {
              blocked = true;
              break;
            }
            availableUnits = Math.min(availableUnits, free);
            const cal = calByDate[date];
            if (cal?.minStay && nights < cal.minStay) {
              blocked = true;
              break;
            }
            if (cal?.maxStay && nights > cal.maxStay) {
              blocked = true;
              break;
            }
            nightTotal += Number(cal?.price ?? plan.basePrice);
          }

          if (blocked || !Number.isFinite(availableUnits)) continue;

          const subtotal = nightTotal * params.rooms;
          const taxesFees =
            subtotal *
            ((Number(plan.taxPercent) + Number(plan.serviceFeePercent)) / 100);

          results.push({
            hotel,
            roomType: room,
            ratePlan: plan,
            nights,
            availableUnits,
            subtotal: Math.round(subtotal * 100) / 100,
            taxesFees: Math.round(taxesFees * 100) / 100,
            total: Math.round((subtotal + taxesFees) * 100) / 100,
          });
        }
      }
    }

    return results;
  }

  async create(input: {
    hotelId: string;
    roomTypeId: string;
    ratePlanId: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
    guestFullName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
  }) {
    const hotel = await this.hotelsRepo.findOne({
      where: { id: input.hotelId },
    });
    const matches = await this.search({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      hotelSlug: hotel?.slug,
    });

    const match = matches.find(
      (r) =>
        r.hotel.id === input.hotelId &&
        r.roomType.id === input.roomTypeId &&
        r.ratePlan.id === input.ratePlanId,
    );
    if (!match) {
      throw new ConflictException(
        'Selected room is no longer available for these dates.',
      );
    }

    const reference = `GRY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const booking = this.bookingsRepo.create({
      reference,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      ratePlanId: input.ratePlanId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      guestFullName: input.guestFullName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      specialRequests: input.specialRequests,
      subtotal: match.subtotal,
      taxesFees: match.taxesFees,
      total: match.total,
      status: BookingStatus.PENDING,
      source: 'website',
    });
    const saved = await this.bookingsRepo.save(booking);

    await this.mail.send(
      input.guestEmail,
      `Greyon booking request ${reference}`,
      `Thank you ${input.guestFullName}. Your booking reference is ${reference}. Status: pending. Total: $${match.total}.`,
    );
    await this.mail.send(
      process.env.ADMIN_NOTIFY_EMAIL ?? 'hello@greyon.com.kh',
      `New booking ${reference}`,
      `Guest ${input.guestFullName} booked ${input.checkIn} → ${input.checkOut}. Total $${match.total}.`,
    );

    return saved;
  }

  findByReference(reference: string) {
    return this.bookingsRepo.findOne({ where: { reference } });
  }

  listAll() {
    return this.bookingsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(reference: string, status: BookingStatus) {
    const booking = await this.findByReference(reference);
    if (!booking) throw new NotFoundException('Booking not found');
    booking.status = status;
    return this.bookingsRepo.save(booking);
  }
}
