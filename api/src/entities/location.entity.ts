import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentStatus } from '../common/enums';
import { Hotel } from './hotel.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'hero_image' })
  heroImage!: string;

  @Column({ type: 'simple-json', default: '[]' })
  gallery!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  highlights!: string[];

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @OneToMany(() => Hotel, (hotel) => hotel.location)
  hotels!: Hotel[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
