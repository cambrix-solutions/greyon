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
import { Hotel } from './hotel.entity';
import { RatePlan } from './rate-plan.entity';
import { Availability } from './availability.entity';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'hotel_id' })
  hotelId!: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.roomTypes)
  @JoinColumn({ name: 'hotel_id' })
  hotel!: Hotel;

  @Column()
  name!: string;

  @Column()
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'simple-json', default: '[]' })
  images!: string[];

  @Column({ name: 'bed_type' })
  bedType!: string;

  @Column({ name: 'room_size' })
  roomSize!: string;

  @Column({ name: 'max_adults', type: 'int' })
  maxAdults!: number;

  @Column({ name: 'max_children', type: 'int', default: 0 })
  maxChildren!: number;

  @Column({ name: 'max_guests', type: 'int' })
  maxGuests!: number;

  @Column({ type: 'simple-json', default: '[]' })
  amenities!: string[];

  @Column({ name: 'base_inventory', type: 'int', default: 0 })
  baseInventory!: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @OneToMany(() => RatePlan, (plan) => plan.roomType)
  ratePlans!: RatePlan[];

  @OneToMany(() => Availability, (availability) => availability.roomType)
  availability!: Availability[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
