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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const class_validator_1 = require("class-validator");
const typeorm_2 = require("typeorm");
const enums_1 = require("../common/enums");
const entities_1 = require("../entities");
const mail_service_1 = require("../mail/mail.service");
class CreateEnquiryDto {
    name;
    email;
    phone;
    subject;
    message;
    consent;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEnquiryDto.prototype, "consent", void 0);
let PublicController = class PublicController {
    hotels;
    locations;
    news;
    enquiries;
    mail;
    constructor(hotels, locations, news, enquiries, mail) {
        this.hotels = hotels;
        this.locations = locations;
        this.news = news;
        this.enquiries = enquiries;
        this.mail = mail;
    }
    listHotels() {
        return this.hotels.find({
            where: { status: enums_1.ContentStatus.PUBLISHED },
            relations: { location: true },
        });
    }
    hotel(slug) {
        return this.hotels.findOne({
            where: { slug, status: enums_1.ContentStatus.PUBLISHED },
            relations: {
                location: true,
                roomTypes: { ratePlans: true },
            },
        });
    }
    listLocations() {
        return this.locations.find({
            where: { status: enums_1.ContentStatus.PUBLISHED },
        });
    }
    location(slug) {
        return this.locations.findOne({
            where: { slug, status: enums_1.ContentStatus.PUBLISHED },
            relations: { hotels: true },
        });
    }
    listNews() {
        return this.news.find({
            where: { status: enums_1.ContentStatus.PUBLISHED },
            order: { publishedAt: 'DESC' },
        });
    }
    newsItem(slug) {
        return this.news.findOne({
            where: { slug, status: enums_1.ContentStatus.PUBLISHED },
        });
    }
    async createEnquiry(body) {
        const enquiry = this.enquiries.create(body);
        const saved = await this.enquiries.save(enquiry);
        await this.mail.send(process.env.ADMIN_NOTIFY_EMAIL ?? 'hello@greyon.com.kh', `New enquiry: ${body.subject}`, `${body.name} <${body.email}> (${body.phone})\n\n${body.message}`);
        return saved;
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('hotels'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "listHotels", null);
__decorate([
    (0, common_1.Get)('hotels/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "hotel", null);
__decorate([
    (0, common_1.Get)('locations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "listLocations", null);
__decorate([
    (0, common_1.Get)('locations/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "location", null);
__decorate([
    (0, common_1.Get)('news'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "listNews", null);
__decorate([
    (0, common_1.Get)('news/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "newsItem", null);
__decorate([
    (0, common_1.Post)('enquiries'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateEnquiryDto]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "createEnquiry", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Hotel)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Location)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.News)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Enquiry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], PublicController);
//# sourceMappingURL=public.controller.js.map