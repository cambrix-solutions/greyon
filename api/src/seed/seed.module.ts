import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Hotel,
  Location,
  News,
  RatePlan,
  RoomType,
  User,
} from '../entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Location,
      Hotel,
      RoomType,
      RatePlan,
      News,
      User,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
