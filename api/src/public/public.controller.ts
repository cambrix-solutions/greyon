import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsBoolean, IsEmail, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { ContentStatus } from '../common/enums';
import { Enquiry, Hotel, Location, News } from '../entities';
import { MailService } from '../mail/mail.service';

class CreateEnquiryDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  subject!: string;

  @IsString()
  message!: string;

  @IsBoolean()
  consent!: boolean;
}

@Controller()
export class PublicController {
  constructor(
    @InjectRepository(Hotel) private readonly hotels: Repository<Hotel>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    @InjectRepository(News) private readonly news: Repository<News>,
    @InjectRepository(Enquiry) private readonly enquiries: Repository<Enquiry>,
    private readonly mail: MailService,
  ) {}

  @Get('hotels')
  listHotels() {
    return this.hotels.find({
      where: { status: ContentStatus.PUBLISHED },
      relations: { location: true },
    });
  }

  @Get('hotels/:slug')
  hotel(@Param('slug') slug: string) {
    return this.hotels.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
      relations: {
        location: true,
        roomTypes: { ratePlans: true },
      },
    });
  }

  @Get('locations')
  listLocations() {
    return this.locations.find({
      where: { status: ContentStatus.PUBLISHED },
    });
  }

  @Get('locations/:slug')
  location(@Param('slug') slug: string) {
    return this.locations.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
      relations: { hotels: true },
    });
  }

  @Get('news')
  listNews() {
    return this.news.find({
      where: { status: ContentStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
  }

  @Get('news/:slug')
  newsItem(@Param('slug') slug: string) {
    return this.news.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
    });
  }

  @Post('enquiries')
  async createEnquiry(@Body() body: CreateEnquiryDto) {
    const enquiry = this.enquiries.create(body);
    const saved = await this.enquiries.save(enquiry);
    await this.mail.send(
      process.env.ADMIN_NOTIFY_EMAIL ?? 'hello@greyon.com.kh',
      `New enquiry: ${body.subject}`,
      `${body.name} <${body.email}> (${body.phone})\n\n${body.message}`,
    );
    return saved;
  }
}
