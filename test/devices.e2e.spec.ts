import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Device, DeviceState } from '../src/devices/entities/device.entity';

describe('DevicesController (e2e)', () => {
  let app: INestApplication;
  let createdDeviceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /devices', () => {
    it('should create a new device', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .send({
          name: 'iPhone 15 Pro',
          brand: 'Apple',
          state: DeviceState.AVAILABLE,
        })
        .expect(201)
        .expect((res: { body: Device }) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('iPhone 15 Pro');
          expect(res.body.brand).toBe('Apple');
          expect(res.body.state).toBe(DeviceState.AVAILABLE);
          expect(res.body).toHaveProperty('createdAt');
          createdDeviceId = res.body.id;
        });
    });

    it('should fail validation for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .send({
          name: 'iPhone 15',
        })
        .expect(400);
    });

    it('should fail validation for invalid state', () => {
      return request(app.getHttpServer())
        .post('/devices')
        .send({
          name: 'iPhone 15',
          brand: 'Apple',
          state: 'invalid-state',
        })
        .expect(400);
    });
  });

  describe('GET /devices', () => {
    it('should return all devices', () => {
      return request(app.getHttpServer())
        .get('/devices')
        .expect(200)
        .expect((res: { body: Device[] }) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter devices by brand', () => {
      return request(app.getHttpServer())
        .get('/devices?brand=Apple')
        .expect(200)
        .expect((res: { body: Device[] }) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((device: Device) => {
            expect(device.brand).toBe('Apple');
          });
        });
    });

    it('should filter devices by state', () => {
      return request(app.getHttpServer())
        .get(`/devices?state=${DeviceState.AVAILABLE}`)
        .expect(200)
        .expect((res: { body: Device[] }) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((device: Device) => {
            expect(device.state).toBe(DeviceState.AVAILABLE);
          });
        });
    });
  });

  describe('GET /devices/:id', () => {
    it('should return a device by id', () => {
      return request(app.getHttpServer())
        .get(`/devices/${createdDeviceId}`)
        .expect(200)
        .expect((res: { body: Device }) => {
          expect(res.body.id).toBe(createdDeviceId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('brand');
        });
    });

    it('should return 404 for non-existent device', () => {
      return request(app.getHttpServer())
        .get('/devices/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer()).get('/devices/invalid-uuid').expect(400);
    });
  });

  describe('PATCH /devices/:id', () => {
    it('should update device state', () => {
      return request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.IN_USE })
        .expect(200)
        .expect((res: { body: Device }) => {
          expect(res.body.state).toBe(DeviceState.IN_USE);
        });
    });

    it('should not allow updating name when device is in-use', async () => {
      await request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.IN_USE });

      return request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ name: 'New Name' })
        .expect(400);
    });

    it('should allow updating state back to available', () => {
      return request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.AVAILABLE })
        .expect(200);
    });
  });

  describe('PUT /devices/:id', () => {
    const deviceUpdate = {
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      state: DeviceState.INACTIVE,
    };

    it('should update device', () => {
      return request(app.getHttpServer())
        .put(`/devices/${createdDeviceId}`)
        .send(deviceUpdate)
        .expect(200)
        .expect((res: { body: Device }) => {
          expect(res.body).toMatchObject(deviceUpdate);
        });
    });

    it('should not allow updating name when device is in-use', async () => {
      await request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.IN_USE });

      return request(app.getHttpServer())
        .put(`/devices/${createdDeviceId}`)
        .send(deviceUpdate)
        .expect(400);
    });

    it('should fail validation for missing required fields', () => {
      return request(app.getHttpServer())
        .put(`/devices/${createdDeviceId}`)
        .send({
          name: 'iPhone 15',
        })
        .expect(400);
    });

    it('should fail validation for invalid state', () => {
      return request(app.getHttpServer())
        .put(`/devices/${createdDeviceId}`)
        .send({
          ...deviceUpdate,
          state: 'invalid-state',
        })
        .expect(400);
    });
  });

  describe('DELETE /devices/:id', () => {
    it('should not delete device when in-use', async () => {
      await request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.IN_USE });

      return request(app.getHttpServer()).delete(`/devices/${createdDeviceId}`).expect(400);
    });

    it('should delete device when not in-use', async () => {
      await request(app.getHttpServer())
        .patch(`/devices/${createdDeviceId}`)
        .send({ state: DeviceState.AVAILABLE });

      return request(app.getHttpServer()).delete(`/devices/${createdDeviceId}`).expect(204);
    });

    it('should return 404 when trying to get deleted device', () => {
      return request(app.getHttpServer()).get(`/devices/${createdDeviceId}`).expect(404);
    });
  });
});
