import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enquiry, Hotel, Location, News } from '../entities';
import { MailModule } from '../mail/mail.module';
import { PublicController } from './public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel, Location, News, Enquiry]),
    MailModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
