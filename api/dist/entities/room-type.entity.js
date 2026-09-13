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
exports.RoomType = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
const hotel_entity_1 = require("./hotel.entity");
const rate_plan_entity_1 = require("./rate-plan.entity");
const availability_entity_1 = require("./availability.entity");
let RoomType = class RoomType {
    id;
    hotelId;
    hotel;
    name;
    slug;
    description;
    images;
    bedType;
    roomSize;
    maxAdults;
    maxChildren;
    maxGuests;
    amenities;
    baseInventory;
    status;
    ratePlans;
    availability;
    createdAt;
    updatedAt;
};
exports.RoomType = RoomType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RoomType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hotel_id' }),
    __metadata("design:type", String)
], RoomType.prototype, "hotelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hotel_entity_1.Hotel, (hotel) => hotel.roomTypes),
    (0, typeorm_1.JoinColumn)({ name: 'hotel_id' }),
    __metadata("design:type", hotel_entity_1.Hotel)
], RoomType.prototype, "hotel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomType.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RoomType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], RoomType.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bed_type' }),
    __metadata("design:type", String)
], RoomType.prototype, "bedType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_size' }),
    __metadata("design:type", String)
], RoomType.prototype, "roomSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_adults', type: 'int' }),
    __metadata("design:type", Number)
], RoomType.prototype, "maxAdults", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_children', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RoomType.prototype, "maxChildren", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_guests', type: 'int' }),
    __metadata("design:type", Number)
], RoomType.prototype, "maxGuests", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], RoomType.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_inventory', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RoomType.prototype, "baseInventory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ContentStatus, default: enums_1.ContentStatus.DRAFT }),
    __metadata("design:type", String)
], RoomType.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rate_plan_entity_1.RatePlan, (plan) => plan.roomType),
    __metadata("design:type", Array)
], RoomType.prototype, "ratePlans", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => availability_entity_1.Availability, (availability) => availability.roomType),
    __metadata("design:type", Array)
], RoomType.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RoomType.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RoomType.prototype, "updatedAt", void 0);
exports.RoomType = RoomType = __decorate([
    (0, typeorm_1.Entity)('room_types')
], RoomType);
//# sourceMappingURL=room-type.entity.js.map