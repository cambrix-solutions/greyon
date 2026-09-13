"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const bookings_module_1 = require("./bookings/bookings.module");
const entities_1 = require("./entities");
const mail_module_1 = require("./mail/mail.module");
const public_module_1 = require("./public/public.module");
const seed_module_1 = require("./seed/seed.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: Number(config.get('DB_PORT', 5432)),
                    username: config.get('DB_USER', 'greyon'),
                    password: config.get('DB_PASS', 'greyon'),
                    database: config.get('DB_NAME', 'greyon'),
                    entities: [
                        entities_1.Location,
                        entities_1.Hotel,
                        entities_1.RoomType,
                        entities_1.RatePlan,
                        entities_1.Availability,
                        entities_1.RateCalendar,
                        entities_1.Booking,
                        entities_1.News,
                        entities_1.Enquiry,
                        entities_1.User,
                    ],
                    synchronize: config.get('DB_SYNC', 'true') === 'true',
                    logging: config.get('DB_LOGGING', 'false') === 'true',
                }),
            }),
            mail_module_1.MailModule,
            auth_module_1.AuthModule,
            public_module_1.PublicModule,
            bookings_module_1.BookingsModule,
            seed_module_1.SeedModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map