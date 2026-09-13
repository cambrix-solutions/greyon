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
import { Location } from './location.entity';
import { RoomType } from './room-type.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'location_id' })
  locationId!: string;

  @ManyToOne(() => Location, (location) => location.hotels)
  @JoinColumn({ name: 'location_id' })
  location!: Location;

  @Column({ name: 'short_description', type: 'text' })
  shortDescription!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  address!: string;

  @Column({ type: 'float' })
  lat!: number;

  @Column({ type: 'float' })
  lng!: number;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column({ name: 'hero_image' })
  heroImage!: string;

  @Column({ type: 'simple-json', default: '[]' })
  gallery!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  amenities!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  policies!: string[];

  @Column({ name: 'check_in_time', default: '14:00' })
  checkInTime!: string;

  @Column({ name: 'check_out_time', default: '12:00' })
  checkOutTime!: string;

  @Column({ default: false })
  featured!: boolean;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @OneToMany(() => RoomType, (room) => room.hotel)
  roomTypes!: RoomType[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
