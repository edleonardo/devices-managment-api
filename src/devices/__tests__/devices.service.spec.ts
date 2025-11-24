/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DevicesService } from '../devices.service';
import { Device, DeviceState } from '../entities/device.entity';

describe('DevicesService', () => {
  let service: DevicesService;

  const mockDevice: Device = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'iPhone 15',
    brand: 'Apple',
    state: DeviceState.AVAILABLE,
    createdAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get(DevicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new device', async () => {
      const createDto = {
        name: 'iPhone 15',
        brand: 'Apple',
        state: DeviceState.AVAILABLE,
      };

      mockRepository.create.mockReturnValue(mockDevice);
      mockRepository.save.mockResolvedValue(mockDevice);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockDevice);
      expect(mockCacheManager.del).toHaveBeenCalledWith('devices:all');
    });
  });

  describe('findAll', () => {
    it('should return cached devices if available', async () => {
      const devices = [mockDevice];
      mockCacheManager.get.mockResolvedValue(devices);

      const result = await service.findAll();

      expect(result).toEqual(devices);
      expect(mockCacheManager.get).toHaveBeenCalledWith('devices:all');
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const devices = [mockDevice];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(devices);

      const result = await service.findAll();

      expect(result).toEqual(devices);
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('devices:all', devices);
    });
  });

  describe('findOne', () => {
    it('should return a device by id', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockDevice);

      const result = await service.findOne(mockDevice.id);

      expect(result).toEqual(mockDevice);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDevice.id },
      });
    });

    it('should throw NotFoundException if device not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a device', async () => {
      const updateDto = { state: DeviceState.IN_USE };
      const updatedDevice = { ...mockDevice, ...updateDto };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockDevice);
      mockRepository.save.mockResolvedValue(updatedDevice);

      const result = await service.update(mockDevice.id, updateDto);

      expect(result.state).toBe(DeviceState.IN_USE);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should prevent updating name when device is in-use', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      const updateDto = { name: 'New Name' };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(inUseDevice);

      await expect(service.update(mockDevice.id, updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should prevent updating brand when device is in-use', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };
      const updateDto = { brand: 'New Brand' };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(inUseDevice);

      await expect(service.update(mockDevice.id, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a device', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockDevice);
      mockRepository.remove.mockResolvedValue(mockDevice);

      await service.remove(mockDevice.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockDevice);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should prevent deleting in-use devices', async () => {
      const inUseDevice = { ...mockDevice, state: DeviceState.IN_USE };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(inUseDevice);

      await expect(service.remove(mockDevice.id)).rejects.toThrow(BadRequestException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByBrand', () => {
    it('should return devices filtered by brand', async () => {
      const devices = [mockDevice];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(devices);

      const result = await service.findByBrand('Apple');

      expect(result).toEqual(devices);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { brand: 'Apple' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByState', () => {
    it('should return devices filtered by state', async () => {
      const devices = [mockDevice];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(devices);

      const result = await service.findByState(DeviceState.AVAILABLE);

      expect(result).toEqual(devices);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { state: DeviceState.AVAILABLE },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
