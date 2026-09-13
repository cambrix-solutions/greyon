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
exports.Location = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../common/enums");
const hotel_entity_1 = require("./hotel.entity");
let Location = class Location {
    id;
    name;
    slug;
    description;
    heroImage;
    gallery;
    highlights;
    status;
    seoTitle;
    seoDescription;
    hotels;
    createdAt;
    updatedAt;
};
exports.Location = Location;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Location.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Location.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Location.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Location.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hero_image' }),
    __metadata("design:type", String)
], Location.prototype, "heroImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], Location.prototype, "gallery", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: '[]' }),
    __metadata("design:type", Array)
], Location.prototype, "highlights", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ContentStatus, default: enums_1.ContentStatus.DRAFT }),
    __metadata("design:type", String)
], Location.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seo_title', nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "seoTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seo_description', nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "seoDescription", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hotel_entity_1.Hotel, (hotel) => hotel.location),
    __metadata("design:type", Array)
], Location.prototype, "hotels", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Location.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Location.prototype, "updatedAt", void 0);
exports.Location = Location = __decorate([
    (0, typeorm_1.Entity)('locations')
], Location);
//# sourceMappingURL=location.entity.js.map