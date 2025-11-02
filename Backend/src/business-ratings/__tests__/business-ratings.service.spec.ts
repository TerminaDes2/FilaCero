import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRatingsService } from '../business-ratings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessRatingDto } from '../dto/create-business-rating.dto';

describe('BusinessRatingsService (unit - mocked Prisma)', () => {
  let service: BusinessRatingsService;
  let mockPrisma: any;
  let createdUser: any;
  let createdBusiness: any;

  beforeAll(async () => {
    // prepare a lightweight mock for PrismaService to avoid DB dependency
    mockPrisma = {
      usuarios: { create: jest.fn() },
      negocio: { create: jest.fn() },
      negocio_rating: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessRatingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(BusinessRatingsService);
  });

  afterAll(async () => {
    if (mockPrisma.$disconnect) {
      await mockPrisma.$disconnect();
    }
  });

  it('inserts a rating and returns serialized response', async () => {
    // prepare fake entities (no DB calls)
    createdUser = { id_usuario: 123, nombre: 'Test User', correo_electronico: 'test@example.com' };
    createdBusiness = { id_negocio: 456, nombre: 'Test Business' };

    const dto: CreateBusinessRatingDto = { estrellas: 5, comentario: 'Excelente!' };

    // mock the upsert to return a rating with included usuarios
    mockPrisma.negocio_rating.upsert.mockResolvedValue({
      id_rating: 789,
      id_negocio: createdBusiness.id_negocio,
      id_usuario: createdUser.id_usuario,
      estrellas: dto.estrellas,
      comentario: dto.comentario,
      creado_en: new Date(),
      usuarios: { id_usuario: createdUser.id_usuario, nombre: createdUser.nombre, avatar_url: null },
    });

    const res = await service.upsertRating(
      String(createdBusiness.id_negocio),
      String(createdUser.id_usuario),
      dto,
    );

    expect(res).toHaveProperty('id');
    expect(res.businessId).toBe(Number(createdBusiness.id_negocio));
    expect(res.user.id).toBe(String(createdUser.id_usuario));
    expect(res.estrellas).toBe(dto.estrellas);
    expect(res.comentario).toBe(dto.comentario);

    // ensure the mock was called with the expected structure
    expect(mockPrisma.negocio_rating.upsert).toHaveBeenCalled();
  }, 20000);
});
