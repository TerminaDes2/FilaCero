import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

type SerializedUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  roleId: string | null;
  accountNumber: string | null;
  age: number | null;
  avatarUrl: string | null;
  credentialUrl: string | null;
  verified: boolean;
  verifiedAt: string | null;
};

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const idHeader = req.headers['x-test-user-id'];
    if (idHeader) {
      const idValue = Array.isArray(idHeader) ? idHeader[0] : idHeader;
      try {
        const parsed = BigInt(idValue);
        req.user = { id_usuario: parsed, id: idValue };
      } catch {
        req.user = { id: idValue };
      }
    }
    return true;
  }
}

describe('UsersController endpoints', () => {
  let app: INestApplication;

  const mockUsersService = {
    findOne: jest.fn<Promise<SerializedUser>, [bigint]>(),
    update: jest.fn<Promise<SerializedUser>, [bigint, UpdateUserDto]>(),
    delete: jest.fn<Promise<{ message: string }>, [bigint]>(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/users/me returns the authenticated user profile', async () => {
    const expected: SerializedUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '5551234567',
      roleId: '2',
      accountNumber: '20251234',
      age: 21,
      avatarUrl: 'https://example.com/avatar.png',
      credentialUrl: null,
      verified: true,
      verifiedAt: '2025-10-17T12:00:00.000Z',
    };
    mockUsersService.findOne.mockResolvedValueOnce(expected);

    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-test-user-id', '1')
      .expect(200);

    expect(res.body).toEqual(expected);
    expect(mockUsersService.findOne).toHaveBeenCalledWith(1n);
  });

  it('GET /api/users/me returns 401 when guard does not attach user', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
    expect(mockUsersService.findOne).not.toHaveBeenCalled();
  });

  it('PUT /api/users/:id updates the current user when IDs match', async () => {
    const payload: UpdateUserDto = {
      name: 'Nuevo Nombre',
      phoneNumber: '5550009999',
      accountNumber: '20259999',
      age: 22,
    };
    const updated: SerializedUser = {
      id: '1',
      name: payload.name!,
      email: 'test@example.com',
      phoneNumber: payload.phoneNumber!,
      roleId: null,
      accountNumber: payload.accountNumber!,
      age: payload.age!,
      avatarUrl: null,
      credentialUrl: null,
      verified: true,
      verifiedAt: null,
    };
    mockUsersService.update.mockResolvedValueOnce(updated);

    const res = await request(app.getHttpServer())
      .put('/api/users/1')
      .set('x-test-user-id', '1')
      .send(payload)
      .expect(200);

    expect(res.body).toEqual(updated);
    expect(mockUsersService.update).toHaveBeenCalledWith(1n, payload);
  });

  it('PUT /api/users/:id returns 401 when path ID differs from token user', async () => {
    await request(app.getHttpServer())
      .put('/api/users/2')
      .set('x-test-user-id', '1')
      .send({ name: 'No importa' })
      .expect(401);

    expect(mockUsersService.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/users/:id removes the current user when IDs match', async () => {
    mockUsersService.delete.mockResolvedValueOnce({ message: 'Cuenta eliminada exitosamente' });

    const res = await request(app.getHttpServer())
      .delete('/api/users/1')
      .set('x-test-user-id', '1')
      .expect(200);

    expect(res.body).toEqual({ message: 'Cuenta eliminada exitosamente' });
    expect(mockUsersService.delete).toHaveBeenCalledWith(1n);
  });

  it('DELETE /api/users/:id returns 401 when IDs do not match', async () => {
    await request(app.getHttpServer())
      .delete('/api/users/3')
      .set('x-test-user-id', '1')
      .expect(401);

    expect(mockUsersService.delete).not.toHaveBeenCalled();
  });
});
