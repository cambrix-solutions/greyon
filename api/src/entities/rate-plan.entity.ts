import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentStatus } from '../common/enums';
import { RoomType } from './room-type.entity';
import { RateCalendar } from './rate-calendar.entity';

@Entity('rate_plans')
export class RatePlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_type_id' })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (room) => room.ratePlans)
  @JoinColumn({ name: 'room_type_id' })
  roomType!: RoomType;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'meal_benefit' })
  mealBenefit!: string;

  @Column({ name: 'cancellation_policy', type: 'text' })
  cancellationPolicy!: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 10 })
  taxPercent!: number;

  @Column({
    name: 'service_fee_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5,
  })
  serviceFeePercent!: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @OneToMany(() => RateCalendar, (calendar) => calendar.ratePlan)
  calendar!: RateCalendar[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
