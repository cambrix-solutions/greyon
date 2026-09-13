import { ContentStatus } from '../common/enums';
import { RoomType } from './room-type.entity';
import { RateCalendar } from './rate-calendar.entity';
export declare class RatePlan {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    name: string;
    description: string;
    mealBenefit: string;
    cancellationPolicy: string;
    basePrice: number;
    taxPercent: number;
    serviceFeePercent: number;
    status: ContentStatus;
    calendar: RateCalendar[];
    createdAt: Date;
    updatedAt: Date;
}
