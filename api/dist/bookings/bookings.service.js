"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const enums_1 = require("../common/enums");
const entities_1 = require("../entities");
const mail_service_1 = require("../mail/mail.service");
let BookingsService = class BookingsService {
    bookingsRepo;
    hotelsRepo;
    roomsRepo;
    ratesRepo;
    availabilityRepo;
    rateCalendarRepo;
    mail;
    constructor(bookingsRepo, hotelsRepo, roomsRepo, ratesRepo, availabilityRepo, rateCalendarRepo, mail) {
        this.bookingsRepo = bookingsRepo;
        this.hotelsRepo = hotelsRepo;
        this.roomsRepo = roomsRepo;
        this.ratesRepo = ratesRepo;
        this.availabilityRepo = availabilityRepo;
        this.rateCalendarRepo = rateCalendarRepo;
        this.mail = mail;
    }
    parseLocal(date) {
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y, (m ?? 1) - 1, d ?? 1);
    }
    toYmd(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    nights(checkIn, checkOut) {
        const start = this.parseLocal(checkIn);
        const end = this.parseLocal(checkOut);
        return Math.round((end.getTime() - start.getTime()) / 86400000);
    }
    eachNight(checkIn, checkOut) {
        const nights = [];
        const cursor = this.parseLocal(checkIn);
        const end = this.parseLocal(checkOut);
        while (cursor < end) {
            nights.push(this.toYmd(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return nights;
    }
    assertDates(checkIn, checkOut) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = this.parseLocal(checkIn);
        const end = this.parseLocal(checkOut);
        if (!(start >= today && end > start)) {
            throw new common_1.BadRequestException('Invalid check-in / check-out dates');
        }
    }
    async unitsForNight(room, date) {
        const row = await this.availabilityRepo.findOne({
            where: { roomTypeId: room.id, date },
        });
        if (row?.stopSell)
            return 0;
        if (row)
            return row.availableUnits;
        return room.baseInventory;
    }
    async bookedOnNight(roomTypeId, date) {
        const next = this.parseLocal(date);
        next.setDate(next.getDate() + 1);
        const nextYmd = this.toYmd(next);
        const overlapping = await this.bookingsRepo
            .createQueryBuilder('b')
            .where('b.room_type_id = :roomTypeId', { roomTypeId })
            .andWhere('b.status != :cancelled', {
            cancelled: enums_1.BookingStatus.CANCELLED,
        })
            .andWhere('b.check_in < :next AND b.check_out > :date', {
            date,
            next: nextYmd,
        })
            .getMany();
        return overlapping.reduce((sum, b) => sum + b.rooms, 0);
    }
    async search(params) {
        this.assertDates(params.checkIn, params.checkOut);
        const nights = this.nights(params.checkIn, params.checkOut);
        const nightDates = this.eachNight(params.checkIn, params.checkOut);
        if (nights < 1 || !nightDates.length)
            return [];
        const hotelsQb = this.hotelsRepo
            .createQueryBuilder('hotel')
            .leftJoinAndSelect('hotel.location', 'location')
            .where('hotel.status = :status', { status: enums_1.ContentStatus.PUBLISHED });
        if (params.hotelSlug) {
            hotelsQb.andWhere('hotel.slug = :slug', { slug: params.hotelSlug });
        }
        else if (params.locationSlug) {
            hotelsQb.andWhere('location.slug = :locationSlug', {
                locationSlug: params.locationSlug,
            });
        }
        const hotels = await hotelsQb.getMany();
        const results = [];
        for (const hotel of hotels) {
            const rooms = await this.roomsRepo.find({
                where: { hotelId: hotel.id, status: enums_1.ContentStatus.PUBLISHED },
            });
            for (const room of rooms) {
                const guests = params.adults + params.children;
                if (params.adults > room.maxAdults ||
                    params.children > room.maxChildren ||
                    guests > room.maxGuests) {
                    continue;
                }
                const plans = await this.ratesRepo.find({
                    where: { roomTypeId: room.id, status: enums_1.ContentStatus.PUBLISHED },
                });
                for (const plan of plans) {
                    let blocked = false;
                    let availableUnits = Number.POSITIVE_INFINITY;
                    let nightTotal = 0;
                    const calendars = await this.rateCalendarRepo.find({
                        where: { ratePlanId: plan.id, date: (0, typeorm_2.In)(nightDates) },
                    });
                    const calByDate = Object.fromEntries(calendars.map((c) => [c.date, c]));
                    for (const date of nightDates) {
                        const free = (await this.unitsForNight(room, date)) -
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
                    if (blocked || !Number.isFinite(availableUnits))
                        continue;
                    const subtotal = nightTotal * params.rooms;
                    const taxesFees = subtotal *
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
    async create(input) {
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
        const match = matches.find((r) => r.hotel.id === input.hotelId &&
            r.roomType.id === input.roomTypeId &&
            r.ratePlan.id === input.ratePlanId);
        if (!match) {
            throw new common_1.ConflictException('Selected room is no longer available for these dates.');
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
            status: enums_1.BookingStatus.PENDING,
            source: 'website',
        });
        const saved = await this.bookingsRepo.save(booking);
        await this.mail.send(input.guestEmail, `Greyon booking request ${reference}`, `Thank you ${input.guestFullName}. Your booking reference is ${reference}. Status: pending. Total: $${match.total}.`);
        await this.mail.send(process.env.ADMIN_NOTIFY_EMAIL ?? 'hello@greyon.com.kh', `New booking ${reference}`, `Guest ${input.guestFullName} booked ${input.checkIn} → ${input.checkOut}. Total $${match.total}.`);
        return saved;
    }
    findByReference(reference) {
        return this.bookingsRepo.findOne({ where: { reference } });
    }
    listAll() {
        return this.bookingsRepo.find({ order: { createdAt: 'DESC' } });
    }
    async updateStatus(reference, status) {
        const booking = await this.findByReference(reference);
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        booking.status = status;
        return this.bookingsRepo.save(booking);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.RoomType)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.RatePlan)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Availability)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.RateCalendar)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map