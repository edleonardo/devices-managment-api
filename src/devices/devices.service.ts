import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Device, DeviceState } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    this.logger.log(`Creating device: ${createDeviceDto.name}`);

    const device = this.deviceRepository.create(createDeviceDto);
    const savedDevice = await this.deviceRepository.save(device);

    await this.invalidateListCaches(createDeviceDto.brand, createDeviceDto.state);

    this.logger.log(`Device created with ID: ${savedDevice.id}`);
    return savedDevice;
  }

  async findAll(): Promise<Device[]> {
    const cacheKey = 'devices:all';

    const cached = await this.cacheManager.get<Device[]>(cacheKey);
    if (cached) {
      this.logger.debug('Returning devices from cache');
      return cached;
    }

    this.logger.log('Fetching all devices from database');
    const devices = await this.deviceRepository.find({
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, devices);

    return devices;
  }

  async findOne(id: string): Promise<Device> {
    const cacheKey = `devices:${id}`;

    const cached = await this.cacheManager.get<Device>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning device ${id} from cache`);
      return cached;
    }

    this.logger.log(`Fetching device ${id} from database`);
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, device);

    return device;
  }

  async findByBrand(brand: string): Promise<Device[]> {
    const cacheKey = `devices:brand:${brand}`;

    const cached = await this.cacheManager.get<Device[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning devices for brand ${brand} from cache`);
      return cached;
    }

    this.logger.log(`Fetching devices for brand ${brand} from database`);
    const devices = await this.deviceRepository.find({
      where: { brand },
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, devices);

    return devices;
  }

  async findByState(state: DeviceState): Promise<Device[]> {
    const cacheKey = `devices:state:${state}`;

    const cached = await this.cacheManager.get<Device[]>(cacheKey);
    if (cached?.length) {
      this.logger.debug(`Returning devices for state ${state} from cache`);
      return cached;
    }

    this.logger.log(`Fetching devices for state ${state} from database`);
    const devices = await this.deviceRepository.find({
      where: { state },
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, devices);

    return devices;
  }

  async update(id: string, updateDeviceDto: Partial<UpdateDeviceDto>): Promise<Device> {
    this.logger.log(`Updating device ${id}`);

    const device = await this.findOne(id);

    if (device.state === DeviceState.IN_USE) {
      if (updateDeviceDto.name || updateDeviceDto.brand) {
        throw new BadRequestException(
          'Name and brand properties cannot be updated when device is in-use',
        );
      }
    }

    const deviceToUpdate = { ...device, ...updateDeviceDto };
    const updatedDevice = await this.deviceRepository.save(deviceToUpdate);

    await this.invalidateDeviceCache(id);
    await this.invalidateListCaches(deviceToUpdate.brand, deviceToUpdate.state);

    this.logger.log(`Device ${id} updated successfully`);
    return updatedDevice;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting device ${id}`);

    const device = await this.findOne(id);

    if (device.state === DeviceState.IN_USE) {
      throw new BadRequestException('In-use devices cannot be deleted');
    }

    await this.deviceRepository.remove(device);

    await this.invalidateDeviceCache(id);
    await this.invalidateListCaches(device.brand, device.state);

    this.logger.log(`Device ${id} deleted successfully`);
  }

  private async invalidateDeviceCache(id: string): Promise<void> {
    await this.cacheManager.del(`devices:${id}`);
  }

  private async invalidateListCaches(brand: string, state: DeviceState): Promise<void> {
    await Promise.all([
      this.cacheManager.del('devices:all'),
      this.cacheManager.del(`devices:brand:${brand}`),
      this.cacheManager.del(`devices:state:${state}`),
    ]);
  }
}
