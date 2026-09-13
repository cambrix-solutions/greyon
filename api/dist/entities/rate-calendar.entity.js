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
exports.RateCalendar = void 0;
const typeorm_1 = require("typeorm");
const rate_plan_entity_1 = require("./rate-plan.entity");
let RateCalendar = class RateCalendar {
    id;
    ratePlanId;
    ratePlan;
    date;
    price;
    minStay;
    maxStay;
};
exports.RateCalendar = RateCalendar;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RateCalendar.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_plan_id' }),
    __metadata("design:type", String)
], RateCalendar.prototype, "ratePlanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rate_plan_entity_1.RatePlan, (plan) => plan.calendar),
    (0, typeorm_1.JoinColumn)({ name: 'rate_plan_id' }),
    __metadata("design:type", rate_plan_entity_1.RatePlan)
], RateCalendar.prototype, "ratePlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], RateCalendar.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RateCalendar.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_stay', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], RateCalendar.prototype, "minStay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_stay', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], RateCalendar.prototype, "maxStay", void 0);
exports.RateCalendar = RateCalendar = __decorate([
    (0, typeorm_1.Entity)('rate_calendar'),
    (0, typeorm_1.Unique)(['ratePlanId', 'date'])
], RateCalendar);
//# sourceMappingURL=rate-calendar.entity.js.map