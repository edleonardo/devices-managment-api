import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceState } from '../entities/device.entity';

export class CreateDeviceDto {
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
  brand: string;

  @ApiProperty({
    description: 'Device state',
    enum: DeviceState,
    default: DeviceState.AVAILABLE,
    example: DeviceState.AVAILABLE,
  })
  @IsEnum(DeviceState)
  state: DeviceState = DeviceState.AVAILABLE;
}
