import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Hotel, Location, News, RatePlan, RoomType, User } from '../entities';
export declare class SeedService implements OnApplicationBootstrap {
    private readonly locations;
    private readonly hotels;
    private readonly rooms;
    private readonly rates;
    private readonly news;
    private readonly users;
    private readonly logger;
    constructor(locations: Repository<Location>, hotels: Repository<Hotel>, rooms: Repository<RoomType>, rates: Repository<RatePlan>, news: Repository<News>, users: Repository<User>);
    onApplicationBootstrap(): Promise<void>;
    private hash;
    seed(): Promise<void>;
}
