import { RoomType } from './room-type.entity';
export declare class Availability {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    date: string;
    availableUnits: number;
    stopSell: boolean;
}
