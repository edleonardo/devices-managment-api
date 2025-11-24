import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DeviceState {
  AVAILABLE = 'available',
  IN_USE = 'in-use',
  INACTIVE = 'inactive',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Device identifier',
    example: '229e8072-d714-4305-a9c2-6ad57c4ecba2',
  })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({
    description: 'Device name',
    example: 'iPhone 15 Pro',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Device brand',
    example: 'Apple',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255 })
  brand: string;

  @ApiProperty({
    description: 'Device state',
    enum: DeviceState,
    default: DeviceState.AVAILABLE,
    example: DeviceState.AVAILABLE,
  })
  @IsEnum(DeviceState)
  @Column({
    type: 'enum',
    enum: DeviceState,
    default: DeviceState.AVAILABLE,
  })
  state: DeviceState;

  @ApiProperty({
    description: 'When the device was created',
    example: '2024-06-15T12:34:56.789Z',
  })
  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
