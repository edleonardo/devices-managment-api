import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from '../devices.controller';
import { DevicesService } from '../devices.service';
import { Device, DeviceState } from '../entities/device.entity';

describe('DevicesController', () => {
  let controller: DevicesController;
  let service: DevicesService;

  const mockDevice: Device = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'iPhone 15',
    brand: 'Apple',
    state: DeviceState.AVAILABLE,
    createdAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByBrand: jest.fn(),
    findByState: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
    service = module.get<DevicesService>(DevicesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a device', async () => {
      const createDto = {
        name: 'iPhone 15',
        brand: 'Apple',
        state: DeviceState.AVAILABLE,
      };

      mockService.create.mockResolvedValue(mockDevice);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all devices when no filter is provided', async () => {
      const devices = [mockDevice];
      mockService.findAll.mockResolvedValue(devices);

      const result = await controller.findAll({});

      expect(result).toEqual(devices);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should filter by brand when provided', async () => {
      const devices = [mockDevice];
      mockService.findByBrand.mockResolvedValue(devices);

      const result = await controller.findAll({ brand: 'Apple' });

      expect(result).toEqual(devices);
      expect(service.findByBrand).toHaveBeenCalledWith('Apple');
    });

    it('should filter by state when provided', async () => {
      const devices = [mockDevice];
      mockService.findByState.mockResolvedValue(devices);

      const result = await controller.findAll({ state: DeviceState.AVAILABLE });

      expect(result).toEqual(devices);
      expect(service.findByState).toHaveBeenCalledWith(DeviceState.AVAILABLE);
    });
  });

  describe('findOne', () => {
    it('should return a device by id', async () => {
      mockService.findOne.mockResolvedValue(mockDevice);

      const result = await controller.findOne(mockDevice.id);

      expect(result).toEqual(mockDevice);
      expect(service.findOne).toHaveBeenCalledWith(mockDevice.id);
    });
  });

  describe('update', () => {
    it('should perform a partial update a device', async () => {
      const updateDto = { state: DeviceState.IN_USE };
      const updatedDevice = { ...mockDevice, ...updateDto };

      mockService.update.mockResolvedValue(updatedDevice);

      const result = await controller.patchUpdate(mockDevice.id, updateDto);

      expect(result).toEqual(updatedDevice);
      expect(service.update).toHaveBeenCalledWith(mockDevice.id, updateDto);
    });

    it('should update a device', async () => {
      const updateDto = { state: DeviceState.AVAILABLE, name: 'iPhone 15 Pro', brand: 'Apple' };
      const updatedDevice = { ...mockDevice, ...updateDto };

      mockService.update.mockResolvedValue(updatedDevice);

      const result = await controller.update(mockDevice.id, updateDto);

      expect(result).toEqual(updatedDevice);
      expect(service.update).toHaveBeenCalledWith(mockDevice.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a device', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(mockDevice.id);

      expect(service.remove).toHaveBeenCalledWith(mockDevice.id);
    });
  });
});
