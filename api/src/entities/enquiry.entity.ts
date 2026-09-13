import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EnquiryStatus } from '../common/enums';

@Entity('enquiries')
export class Enquiry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: false })
  consent!: boolean;

  @Column({ type: 'enum', enum: EnquiryStatus, default: EnquiryStatus.NEW })
  status!: EnquiryStatus;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
