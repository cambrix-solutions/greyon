import { ContentStatus } from '../common/enums';
import { Hotel } from './hotel.entity';
import { RatePlan } from './rate-plan.entity';
import { Availability } from './availability.entity';
export declare class RoomType {
    id: string;
    hotelId: string;
    hotel: Hotel;
    name: string;
    slug: string;
    description: string;
    images: string[];
    bedType: string;
    roomSize: string;
    maxAdults: number;
    maxChildren: number;
    maxGuests: number;
    amenities: string[];
    baseInventory: number;
    status: ContentStatus;
    ratePlans: RatePlan[];
    availability: Availability[];
    createdAt: Date;
    updatedAt: Date;
}
