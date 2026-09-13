import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus } from '../common/enums';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ name: 'hotel_id' })
  hotelId!: string;

  @Column({ name: 'room_type_id' })
  roomTypeId!: string;

  @Column({ name: 'rate_plan_id' })
  ratePlanId!: string;

  @Column({ name: 'check_in', type: 'date' })
  checkIn!: string;

  @Column({ name: 'check_out', type: 'date' })
  checkOut!: string;

  @Column({ type: 'int', default: 1 })
  rooms!: number;

  @Column({ type: 'int' })
  adults!: number;

  @Column({ type: 'int', default: 0 })
  children!: number;

  @Column({ name: 'guest_full_name' })
  guestFullName!: string;

  @Column({ name: 'guest_email' })
  guestEmail!: string;

  @Column({ name: 'guest_phone' })
  guestPhone!: string;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ name: 'taxes_fees', type: 'decimal', precision: 10, scale: 2 })
  taxesFees!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ default: 'website' })
  source!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
