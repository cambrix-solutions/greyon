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
exports.Booking = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
let Booking = class Booking {
    id;
    reference;
    hotelId;
    roomTypeId;
    ratePlanId;
    checkIn;
    checkOut;
    rooms;
    adults;
    children;
    guestFullName;
    guestEmail;
    guestPhone;
    specialRequests;
    subtotal;
    taxesFees;
    total;
    status;
    source;
    notes;
    createdAt;
    updatedAt;
};
exports.Booking = Booking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Booking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Booking.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hotel_id' }),
    __metadata("design:type", String)
], Booking.prototype, "hotelId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_type_id' }),
    __metadata("design:type", String)
], Booking.prototype, "roomTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_plan_id' }),
    __metadata("design:type", String)
], Booking.prototype, "ratePlanId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'check_in', type: 'date' }),
    __metadata("design:type", String)
], Booking.prototype, "checkIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'check_out', type: 'date' }),
    __metadata("design:type", String)
], Booking.prototype, "checkOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Booking.prototype, "rooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Booking.prototype, "adults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Booking.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_full_name' }),
    __metadata("design:type", String)
], Booking.prototype, "guestFullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_email' }),
    __metadata("design:type", String)
], Booking.prototype, "guestEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_phone' }),
    __metadata("design:type", String)
], Booking.prototype, "guestPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'special_requests', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "specialRequests", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Booking.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'taxes_fees', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Booking.prototype, "taxesFees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Booking.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.BookingStatus, default: enums_1.BookingStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'website' }),
    __metadata("design:type", String)
], Booking.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "updatedAt", void 0);
exports.Booking = Booking = __decorate([
    (0, typeorm_1.Entity)('bookings')
], Booking);
//# sourceMappingURL=booking.entity.js.map