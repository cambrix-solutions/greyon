import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RoomType } from './room-type.entity';

@Entity('availability')
@Unique(['roomTypeId', 'date'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_type_id' })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (room) => room.availability)
  @JoinColumn({ name: 'room_type_id' })
  roomType!: RoomType;

  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'available_units', type: 'int' })
  availableUnits!: number;

  @Column({ name: 'stop_sell', default: false })
  stopSell!: boolean;
}
