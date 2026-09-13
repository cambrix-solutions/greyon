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
exports.Availability = void 0;
const typeorm_1 = require("typeorm");
const room_type_entity_1 = require("./room-type.entity");
let Availability = class Availability {
    id;
    roomTypeId;
    roomType;
    date;
    availableUnits;
    stopSell;
};
exports.Availability = Availability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Availability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_type_id' }),
    __metadata("design:type", String)
], Availability.prototype, "roomTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_type_entity_1.RoomType, (room) => room.availability),
    (0, typeorm_1.JoinColumn)({ name: 'room_type_id' }),
    __metadata("design:type", room_type_entity_1.RoomType)
], Availability.prototype, "roomType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Availability.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'available_units', type: 'int' }),
    __metadata("design:type", Number)
], Availability.prototype, "availableUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stop_sell', default: false }),
    __metadata("design:type", Boolean)
], Availability.prototype, "stopSell", void 0);
exports.Availability = Availability = __decorate([
    (0, typeorm_1.Entity)('availability'),
    (0, typeorm_1.Unique)(['roomTypeId', 'date'])
], Availability);
//# sourceMappingURL=availability.entity.js.map