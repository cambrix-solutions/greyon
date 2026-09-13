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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hotel = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
const location_entity_1 = require("./location.entity");
const room_type_entity_1 = require("./room-type.entity");
let Hotel = class Hotel {
    id;
    name;
    slug;
    locationId;
    location;
    shortDescription;
    description;
    address;
    lat;
    lng;
    phone;
    email;
    heroImage;
    gallery;
    amenities;
    policies;
    checkInTime;
    checkOutTime;
    featured;
    status;
    seoTitle;
    seoDescription;
    roomTypes;
    createdAt;
    updatedAt;
};
exports.Hotel = Hotel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Hotel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Hotel.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_id' }),
    __metadata("design:type", String)
], Hotel.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location, (location) => location.hotels),
    (0, typeorm_1.JoinColumn)({ name: 'location_id' }),
    __metadata("design:type", location_entity_1.Location)
], Hotel.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'short_description', type: 'text' }),
    __metadata("design:type", String)
], Hotel.prototype, "shortDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Hotel.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Hotel.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Hotel.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hero_image' }),
    __metadata("design:type", String)
], Hotel.prototype, "heroImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], Hotel.prototype, "gallery", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], Hotel.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], Hotel.prototype, "policies", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'check_in_time', default: '14:00' }),
    __metadata("design:type", String)
], Hotel.prototype, "checkInTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'check_out_time', default: '12:00' }),
    __metadata("design:type", String)
], Hotel.prototype, "checkOutTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Hotel.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ContentStatus, default: enums_1.ContentStatus.DRAFT }),
    __metadata("design:type", String)
], Hotel.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seo_title', nullable: true }),
    __metadata("design:type", String)
], Hotel.prototype, "seoTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seo_description', nullable: true }),
    __metadata("design:type", String)
], Hotel.prototype, "seoDescription", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => room_type_entity_1.RoomType, (room) => room.hotel),
    __metadata("design:type", Array)
], Hotel.prototype, "roomTypes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Hotel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Hotel.prototype, "updatedAt", void 0);
exports.Hotel = Hotel = __decorate([
    (0, typeorm_1.Entity)('hotels')
], Hotel);
//# sourceMappingURL=hotel.entity.js.map