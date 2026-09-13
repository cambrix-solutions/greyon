import { RatePlan } from './rate-plan.entity';
export declare class RateCalendar {
    id: string;
    ratePlanId: string;
    ratePlan: RatePlan;
    date: string;
    price: number;
    minStay?: number;
    maxStay?: number;
}
