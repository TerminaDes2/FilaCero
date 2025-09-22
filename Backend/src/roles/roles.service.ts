import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.roles.findMany();
  }

  create(nombre_rol: string) {
    return this.prisma.roles.create({ data: { nombre_rol } });
  }
}
