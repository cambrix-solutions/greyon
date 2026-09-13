import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BookingStatus, AdminRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';

class SearchAvailabilityDto {
  @IsOptional()
  @IsString()
  locationSlug?: string;

  @IsOptional()
  @IsString()
  hotelSlug?: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsInt()
  @Min(1)
  rooms!: number;

  @IsInt()
  @Min(1)
  adults!: number;

  @IsInt()
  @Min(0)
  children!: number;
}

class CreateBookingDto {
  @IsString()
  hotelId!: string;

  @IsString()
  roomTypeId!: string;

  @IsString()
  ratePlanId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsInt()
  @Min(1)
  rooms!: number;

  @IsInt()
  @Min(1)
  adults!: number;

  @IsInt()
  @Min(0)
  children!: number;

  @IsString()
  guestFullName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  guestPhone!: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}

class UpdateStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  search(@Query() query: SearchAvailabilityDto) {
    return this.bookingsService.search(query);
  }

  @Post('bookings')
  create(@Body() body: CreateBookingDto) {
    return this.bookingsService.create(body);
  }

  @Get('bookings/:reference')
  async findOne(@Param('reference') reference: string) {
    const booking = await this.bookingsService.findByReference(reference);
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.BOOKING_ADMIN)
  listAdmin() {
    return this.bookingsService.listAll();
  }

  @Patch('admin/bookings/:reference/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.BOOKING_ADMIN)
  updateStatus(
    @Param('reference') reference: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.bookingsService.updateStatus(reference, body.status);
  }
}
