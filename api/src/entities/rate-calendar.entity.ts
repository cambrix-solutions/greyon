import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RatePlan } from './rate-plan.entity';

@Entity('rate_calendar')
@Unique(['ratePlanId', 'date'])
export class RateCalendar {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rate_plan_id' })
  ratePlanId!: string;

  @ManyToOne(() => RatePlan, (plan) => plan.calendar)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan!: RatePlan;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'min_stay', type: 'int', nullable: true })
  minStay?: number;

  @Column({ name: 'max_stay', type: 'int', nullable: true })
  maxStay?: number;
}
