export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum EnquiryStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

export enum AdminRole {
  CONTENT_ADMIN = 'content_admin',
  BOOKING_ADMIN = 'booking_admin',
  SUPER_ADMIN = 'super_admin',
}
