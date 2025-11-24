import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PatchUpdateDeviceDto, UpdateDeviceDto } from './dto/update-device.dto';
import { QueryDeviceDto } from './dto/query-device.dto';
import { Device, DeviceState } from './entities/device.entity';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({
    status: 201,
    description: 'Device successfully created',
    type: Device,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices or filter by brand/state' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filter by brand' })
  @ApiQuery({
    name: 'state',
    required: false,
    enum: DeviceState,
    description: 'Filter by state',
  })
  @ApiResponse({
    status: 200,
    description: 'List of devices',
    type: [Device],
  })
  async findAll(@Query() query: QueryDeviceDto): Promise<Device[]> {
    if (query.brand) {
      return this.devicesService.findByBrand(query.brand);
    }
    if (query.state) {
      return this.devicesService.findByState(query.state);
    }
    return this.devicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single device by ID' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({
    status: 200,
    description: 'Device found',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({
    status: 200,
    description: 'Device successfully updated',
    type: Device,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or device is in-use',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  patchUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: PatchUpdateDeviceDto,
  ): Promise<Device> {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({
    status: 200,
    description: 'Device successfully updated',
    type: Device,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or device is in-use',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({ status: 204, description: 'Device successfully deleted' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - device is in-use and cannot be deleted',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.devicesService.remove(id);
  }
}
