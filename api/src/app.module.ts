import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import {
  Availability,
  Booking,
  Enquiry,
  Hotel,
  Location,
  News,
  RateCalendar,
  RatePlan,
  RoomType,
  User,
} from './entities';
import { MailModule } from './mail/mail.module';
import { PublicModule } from './public/public.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'greyon'),
        password: config.get('DB_PASS', 'greyon'),
        database: config.get('DB_NAME', 'greyon'),
        entities: [
          Location,
          Hotel,
          RoomType,
          RatePlan,
          Availability,
          RateCalendar,
          Booking,
          News,
          Enquiry,
          User,
        ],
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
    }),
    MailModule,
    AuthModule,
    PublicModule,
    BookingsModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
