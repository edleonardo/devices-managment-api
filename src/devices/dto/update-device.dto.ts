import { IsString, IsEnum, MaxLength, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceState } from '../entities/device.entity';

export class UpdateDeviceDto {
  @ApiProperty({
    description: 'Device name (cannot be updated if device is in-use)',
    example: 'iPhone 15 Pro Max',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Device brand (cannot be updated if device is in-use)',
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
    example: DeviceState.IN_USE,
  })
  @IsEnum(DeviceState)
  @IsNotEmpty()
  state: DeviceState;
}

export class PatchUpdateDeviceDto {
  @ApiPropertyOptional({
    description: 'Device name (cannot be updated if device is in-use)',
    example: 'iPhone 15 Pro Max',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Device brand (cannot be updated if device is in-use)',
    example: 'Apple',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  brand?: string;

  @ApiPropertyOptional({
    description: 'Device state',
    enum: DeviceState,
    example: DeviceState.IN_USE,
  })
  @IsEnum(DeviceState)
  @IsOptional()
  state?: DeviceState;
}
