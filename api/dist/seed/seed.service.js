"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const enums_1 = require("../common/enums");
const entities_1 = require("../entities");
let SeedService = SeedService_1 = class SeedService {
    locations;
    hotels;
    rooms;
    rates;
    news;
    users;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(locations, hotels, rooms, rates, news, users) {
        this.locations = locations;
        this.hotels = hotels;
        this.rooms = rooms;
        this.rates = rates;
        this.news = news;
        this.users = users;
    }
    async onApplicationBootstrap() {
        if (process.env.SEED_ON_BOOT !== 'true')
            return;
        const count = await this.locations.count();
        if (count > 0) {
            this.logger.log('Seed skipped — data already present');
            return;
        }
        await this.seed();
        this.logger.log('Demo seed completed');
    }
    hash(password) {
        return (0, crypto_1.createHash)('sha256').update(password).digest('hex');
    }
    async seed() {
        const locs = await this.locations.save([
            {
                name: 'Phnom Penh',
                slug: 'phnom-penh',
                description: 'Cambodia’s capital offers riverside energy and Greyon hospitality.',
                heroImage: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Royal Palace', 'Riverside', 'Cuisine'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Sihanoukville',
                slug: 'sihanoukville',
                description: 'Coastal escapes and island access.',
                heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Beaches', 'Islands'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Kampot',
                slug: 'kampot',
                description: 'River-town charm and pepper country.',
                heroImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Pepper', 'River'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Kep',
                slug: 'kep',
                description: 'Quiet seaside living and seafood.',
                heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Seafood', 'Hills'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Siem Reap',
                slug: 'siem-reap',
                description: 'Gateway to Angkor with Greyon stays.',
                heroImage: 'https://images.unsplash.com/photo-1555881403-32f6c0a9d0a2?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Angkor', 'Markets'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Battambang',
                slug: 'battambang',
                description: 'Colonial streets and countryside calm.',
                heroImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                highlights: ['Bamboo train', 'Temples'],
                status: enums_1.ContentStatus.PUBLISHED,
            },
        ]);
        const bySlug = Object.fromEntries(locs.map((l) => [l.slug, l]));
        const hotels = await this.hotels.save([
            {
                name: 'Greyon Riverside Phnom Penh',
                slug: 'greyon-riverside-phnom-penh',
                locationId: bySlug['phnom-penh'].id,
                shortDescription: 'Riverside calm with contemporary suites.',
                description: 'Greyon Riverside Phnom Penh overlooking the Tonle Sap.',
                address: 'Sisowath Quay, Phnom Penh',
                lat: 11.5683,
                lng: 104.9308,
                phone: '+855 23 000 111',
                email: 'riverside@greyon.com.kh',
                heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                amenities: ['Pool', 'Wi-Fi', 'Restaurant'],
                policies: ['Check-in 14:00', 'Check-out 12:00'],
                checkInTime: '14:00',
                checkOutTime: '12:00',
                featured: true,
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                name: 'Greyon Angkor Siem Reap',
                slug: 'greyon-angkor-siem-reap',
                locationId: bySlug['siem-reap'].id,
                shortDescription: 'Rest near Angkor.',
                description: 'Greyon Angkor Siem Reap for temple explorers.',
                address: 'Siem Reap, Cambodia',
                lat: 13.3633,
                lng: 103.8603,
                phone: '+855 63 000 222',
                email: 'angkor@greyon.com.kh',
                heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
                gallery: [],
                amenities: ['Pool', 'Wi-Fi'],
                policies: ['Check-in 14:00', 'Check-out 12:00'],
                checkInTime: '14:00',
                checkOutTime: '12:00',
                featured: true,
                status: enums_1.ContentStatus.PUBLISHED,
            },
        ]);
        const riverside = hotels[0];
        const angkor = hotels[1];
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
                status: enums_1.ContentStatus.PUBLISHED,
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
                status: enums_1.ContentStatus.PUBLISHED,
            },
        ]);
        await this.rates.save([
            {
                roomTypeId: rooms[0].id,
                name: 'Flexible Rate',
                description: 'Free cancellation up to 48 hours.',
                mealBenefit: 'Breakfast included',
                cancellationPolicy: 'Free cancellation up to 48 hours before arrival.',
                basePrice: 95,
                taxPercent: 10,
                serviceFeePercent: 5,
                status: enums_1.ContentStatus.PUBLISHED,
            },
            {
                roomTypeId: rooms[1].id,
                name: 'Flexible Rate',
                description: 'Breakfast included.',
                mealBenefit: 'Breakfast included',
                cancellationPolicy: 'Free cancellation up to 48 hours before arrival.',
                basePrice: 85,
                taxPercent: 10,
                serviceFeePercent: 5,
                status: enums_1.ContentStatus.PUBLISHED,
            },
        ]);
        await this.news.save([
            {
                title: 'Greyon opens riverside season',
                slug: 'greyon-opens-riverside-season',
                excerpt: 'Discover our Phnom Penh waterfront stay.',
                body: 'Greyon Riverside welcomes guests with seasonal offers.',
                coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                publishedAt: new Date().toISOString().slice(0, 10),
                status: enums_1.ContentStatus.PUBLISHED,
            },
        ]);
        await this.users.save([
            {
                name: 'Sovann Meas',
                email: 'admin@greyon.com.kh',
                passwordHash: this.hash('password'),
                role: enums_1.AdminRole.SUPER_ADMIN,
                active: true,
            },
            {
                name: 'Dara Chhim',
                email: 'content@greyon.com.kh',
                passwordHash: this.hash('password'),
                role: enums_1.AdminRole.CONTENT_ADMIN,
                active: true,
            },
            {
                name: 'Kanha Sok',
                email: 'bookings@greyon.com.kh',
                passwordHash: this.hash('password'),
                role: enums_1.AdminRole.BOOKING_ADMIN,
                active: true,
            },
        ]);
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Location)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.RoomType)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.RatePlan)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.News)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map