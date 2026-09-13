import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import {
  AdminRole,
  ContentStatus,
} from '../common/enums';
import {
  Hotel,
  Location,
  News,
  RatePlan,
  RoomType,
  User,
} from '../entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    @InjectRepository(Hotel) private readonly hotels: Repository<Hotel>,
    @InjectRepository(RoomType) private readonly rooms: Repository<RoomType>,
    @InjectRepository(RatePlan) private readonly rates: Repository<RatePlan>,
    @InjectRepository(News) private readonly news: Repository<News>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_ON_BOOT !== 'true') return;
    const count = await this.locations.count();
    if (count > 0) {
      this.logger.log('Seed skipped — data already present');
      return;
    }
    await this.seed();
    this.logger.log('Demo seed completed');
  }

  private hash(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  async seed() {
    const locs = await this.locations.save([
      {
        name: 'Phnom Penh',
        slug: 'phnom-penh',
        description:
          'Cambodia’s capital offers riverside energy and Greyon hospitality.',
        heroImage:
          'https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Royal Palace', 'Riverside', 'Cuisine'],
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Sihanoukville',
        slug: 'sihanoukville',
        description: 'Coastal escapes and island access.',
        heroImage:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Beaches', 'Islands'],
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Kampot',
        slug: 'kampot',
        description: 'River-town charm and pepper country.',
        heroImage:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Pepper', 'River'],
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Kep',
        slug: 'kep',
        description: 'Quiet seaside living and seafood.',
        heroImage:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Seafood', 'Hills'],
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Siem Reap',
        slug: 'siem-reap',
        description: 'Gateway to Angkor with Greyon stays.',
        heroImage:
          'https://images.unsplash.com/photo-1555881403-32f6c0a9d0a2?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Angkor', 'Markets'],
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Battambang',
        slug: 'battambang',
        description: 'Colonial streets and countryside calm.',
        heroImage:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        highlights: ['Bamboo train', 'Temples'],
        status: ContentStatus.PUBLISHED,
      },
    ]);

    const bySlug = Object.fromEntries(locs.map((l) => [l.slug, l]));

    const hotels = await this.hotels.save([
      {
        name: 'Greyon Riverside Phnom Penh',
        slug: 'greyon-riverside-phnom-penh',
        locationId: bySlug['phnom-penh']!.id,
        shortDescription: 'Riverside calm with contemporary suites.',
        description: 'Greyon Riverside Phnom Penh overlooking the Tonle Sap.',
        address: 'Sisowath Quay, Phnom Penh',
        lat: 11.5683,
        lng: 104.9308,
        phone: '+855 23 000 111',
        email: 'riverside@greyon.com.kh',
        heroImage:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        amenities: ['Pool', 'Wi-Fi', 'Restaurant'],
        policies: ['Check-in 14:00', 'Check-out 12:00'],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        featured: true,
        status: ContentStatus.PUBLISHED,
      },
      {
        name: 'Greyon Angkor Siem Reap',
        slug: 'greyon-angkor-siem-reap',
        locationId: bySlug['siem-reap']!.id,
        shortDescription: 'Rest near Angkor.',
        description: 'Greyon Angkor Siem Reap for temple explorers.',
        address: 'Siem Reap, Cambodia',
        lat: 13.3633,
        lng: 103.8603,
        phone: '+855 63 000 222',
        email: 'angkor@greyon.com.kh',
        heroImage:
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
        gallery: [],
        amenities: ['Pool', 'Wi-Fi'],
        policies: ['Check-in 14:00', 'Check-out 12:00'],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        featured: true,
        status: ContentStatus.PUBLISHED,
      },
    ]);

    const riverside = hotels[0]!;
    const angkor = hotels[1]!;

    const rooms = await this.rooms.save([
      {
        hotelId: riverside.id,
        name: 'Deluxe River View',
        slug: 'deluxe-river-view',
        description: 'River-facing deluxe room.',
        bedType: 'King',
        roomSize: '32 m²',
        maxAdults: 2,
        maxChildren: 1,
        maxGuests: 3,
        amenities: ['Wi-Fi', 'River view'],
        images: [],
        baseInventory: 8,
        status: ContentStatus.PUBLISHED,
      },
      {
        hotelId: angkor.id,
        name: 'Garden Room',
        slug: 'garden-room',
        description: 'Garden-facing room.',
        bedType: 'Queen',
        roomSize: '28 m²',
        maxAdults: 2,
        maxChildren: 1,
        maxGuests: 3,
        amenities: ['Wi-Fi', 'Garden'],
        images: [],
        baseInventory: 10,
        status: ContentStatus.PUBLISHED,
      },
    ]);

    await this.rates.save([
      {
        roomTypeId: rooms[0]!.id,
        name: 'Flexible Rate',
        description: 'Free cancellation up to 48 hours.',
        mealBenefit: 'Breakfast included',
        cancellationPolicy: 'Free cancellation up to 48 hours before arrival.',
        basePrice: 95,
        taxPercent: 10,
        serviceFeePercent: 5,
        status: ContentStatus.PUBLISHED,
      },
      {
        roomTypeId: rooms[1]!.id,
        name: 'Flexible Rate',
        description: 'Breakfast included.',
        mealBenefit: 'Breakfast included',
        cancellationPolicy: 'Free cancellation up to 48 hours before arrival.',
        basePrice: 85,
        taxPercent: 10,
        serviceFeePercent: 5,
        status: ContentStatus.PUBLISHED,
      },
    ]);

    await this.news.save([
      {
        title: 'Greyon opens riverside season',
        slug: 'greyon-opens-riverside-season',
        excerpt: 'Discover our Phnom Penh waterfront stay.',
        body: 'Greyon Riverside welcomes guests with seasonal offers.',
        coverImage:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        publishedAt: new Date().toISOString().slice(0, 10),
        status: ContentStatus.PUBLISHED,
      },
    ]);

    await this.users.save([
      {
        name: 'Greyon Developer',
        email: 'dev@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.SUPER_ADMIN,
        packageId: 'pkg-developer',
        active: true,
      },
      {
        name: 'Sovann Meas',
        email: 'admin@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.SUPER_ADMIN,
        packageId: 'pkg-org-full',
        active: true,
      },
      {
        name: 'Phnom Penh Manager',
        email: 'pp@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.CONTENT_ADMIN,
        packageId: 'pkg-loc-booking',
        active: true,
      },
      {
        name: 'Siem Reap Manager',
        email: 'sr@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.CONTENT_ADMIN,
        packageId: 'pkg-loc-content',
        active: true,
      },
      {
        name: 'Angkor Front Desk',
        email: 'angkor@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.BOOKING_ADMIN,
        packageId: 'pkg-hotel-booking',
        active: true,
      },
      {
        name: 'Riverside Front Desk',
        email: 'hotel@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.BOOKING_ADMIN,
        packageId: 'pkg-hotel-core',
        active: true,
      },
      {
        name: 'Dara Chhim',
        email: 'content@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.CONTENT_ADMIN,
        packageId: 'pkg-content-admin',
        active: true,
      },
      {
        name: 'Kanha Sok',
        email: 'bookings@greyon.com.kh',
        passwordHash: this.hash('password'),
        role: AdminRole.BOOKING_ADMIN,
        packageId: 'pkg-booking-admin',
        active: true,
      },
    ]);
  }
}
