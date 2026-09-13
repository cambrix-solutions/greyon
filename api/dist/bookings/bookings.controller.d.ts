import { BookingStatus } from '../common/enums';
import { BookingsService } from './bookings.service';
declare class SearchAvailabilityDto {
    locationSlug?: string;
    hotelSlug?: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
}
declare class CreateBookingDto {
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
}
declare class UpdateStatusDto {
    status: BookingStatus;
}
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    search(query: SearchAvailabilityDto): Promise<{
        hotel: import("../entities").Hotel;
        roomType: import("../entities").RoomType;
        ratePlan: import("../entities").RatePlan;
        nights: number;
        availableUnits: number;
        subtotal: number;
        taxesFees: number;
        total: number;
    }[]>;
    create(body: CreateBookingDto): Promise<import("../entities").Booking>;
    findOne(reference: string): Promise<import("../entities").Booking>;
    listAdmin(): Promise<import("../entities").Booking[]>;
    updateStatus(reference: string, body: UpdateStatusDto): Promise<import("../entities").Booking>;
}
export {};
