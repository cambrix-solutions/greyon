import { BookingStatus } from '../common/enums';
export declare class Booking {
    id: string;
    reference: string;
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
    subtotal: number;
    taxesFees: number;
    total: number;
    status: BookingStatus;
    source: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
