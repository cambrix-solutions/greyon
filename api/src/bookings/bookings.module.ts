import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Availability,
  Booking,
  Hotel,
  RateCalendar,
  RatePlan,
  RoomType,
} from '../entities';
import { MailModule } from '../mail/mail.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Hotel,
      RoomType,
      RatePlan,
      Availability,
      RateCalendar,
    ]),
    MailModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
