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
exports.RatePlan = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
const room_type_entity_1 = require("./room-type.entity");
const rate_calendar_entity_1 = require("./rate-calendar.entity");
let RatePlan = class RatePlan {
    id;
    roomTypeId;
    roomType;
    name;
    description;
    mealBenefit;
    cancellationPolicy;
    basePrice;
    taxPercent;
    serviceFeePercent;
    status;
    calendar;
    createdAt;
    updatedAt;
};
exports.RatePlan = RatePlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RatePlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_type_id' }),
    __metadata("design:type", String)
], RatePlan.prototype, "roomTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_type_entity_1.RoomType, (room) => room.ratePlans),
    (0, typeorm_1.JoinColumn)({ name: 'room_type_id' }),
    __metadata("design:type", room_type_entity_1.RoomType)
], RatePlan.prototype, "roomType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RatePlan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RatePlan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meal_benefit' }),
    __metadata("design:type", String)
], RatePlan.prototype, "mealBenefit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancellation_policy', type: 'text' }),
    __metadata("design:type", String)
], RatePlan.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RatePlan.prototype, "basePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 10 }),
    __metadata("design:type", Number)
], RatePlan.prototype, "taxPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'service_fee_percent',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 5,
    }),
    __metadata("design:type", Number)
], RatePlan.prototype, "serviceFeePercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ContentStatus, default: enums_1.ContentStatus.DRAFT }),
    __metadata("design:type", String)
], RatePlan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rate_calendar_entity_1.RateCalendar, (calendar) => calendar.ratePlan),
    __metadata("design:type", Array)
], RatePlan.prototype, "calendar", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RatePlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RatePlan.prototype, "updatedAt", void 0);
exports.RatePlan = RatePlan = __decorate([
    (0, typeorm_1.Entity)('rate_plans')
], RatePlan);
//# sourceMappingURL=rate-plan.entity.js.map