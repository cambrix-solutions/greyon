"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRole = exports.EnquiryStatus = exports.BookingStatus = exports.ContentStatus = void 0;
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DRAFT"] = "draft";
    ContentStatus["PUBLISHED"] = "published";
    ContentStatus["ARCHIVED"] = "archived";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var EnquiryStatus;
(function (EnquiryStatus) {
    EnquiryStatus["NEW"] = "new";
    EnquiryStatus["IN_PROGRESS"] = "in_progress";
    EnquiryStatus["CLOSED"] = "closed";
})(EnquiryStatus || (exports.EnquiryStatus = EnquiryStatus = {}));
var AdminRole;
(function (AdminRole) {
    AdminRole["CONTENT_ADMIN"] = "content_admin";
    AdminRole["BOOKING_ADMIN"] = "booking_admin";
    AdminRole["SUPER_ADMIN"] = "super_admin";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
//# sourceMappingURL=enums.js.map