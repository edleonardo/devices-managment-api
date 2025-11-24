import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceState } from '../entities/device.entity';

export class QueryDeviceDto {
  @ApiPropertyOptional({
    description: 'Filter devices by brand',
    example: 'Apple',
  })
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter devices by state',
    enum: DeviceState,
    example: DeviceState.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(DeviceState)
  state?: DeviceState;
}
