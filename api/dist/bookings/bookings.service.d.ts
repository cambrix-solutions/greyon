import { Repository } from 'typeorm';
import { BookingStatus } from '../common/enums';
import { Availability, Booking, Hotel, RateCalendar, RatePlan, RoomType } from '../entities';
import { MailService } from '../mail/mail.service';
export declare class BookingsService {
    private readonly bookingsRepo;
    private readonly hotelsRepo;
    private readonly roomsRepo;
    private readonly ratesRepo;
    private readonly availabilityRepo;
    private readonly rateCalendarRepo;
    private readonly mail;
    constructor(bookingsRepo: Repository<Booking>, hotelsRepo: Repository<Hotel>, roomsRepo: Repository<RoomType>, ratesRepo: Repository<RatePlan>, availabilityRepo: Repository<Availability>, rateCalendarRepo: Repository<RateCalendar>, mail: MailService);
    private parseLocal;
    private toYmd;
    private nights;
    private eachNight;
    private assertDates;
    private unitsForNight;
    private bookedOnNight;
    search(params: {
        locationSlug?: string;
        hotelSlug?: string;
        checkIn: string;
        checkOut: string;
        rooms: number;
        adults: number;
        children: number;
    }): Promise<{
        hotel: Hotel;
        roomType: RoomType;
        ratePlan: RatePlan;
        nights: number;
        availableUnits: number;
        subtotal: number;
        taxesFees: number;
        total: number;
    }[]>;
    create(input: {
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
    }): Promise<Booking>;
    findByReference(reference: string): Promise<Booking | null>;
    listAll(): Promise<Booking[]>;
    updateStatus(reference: string, status: BookingStatus): Promise<Booking>;
}
