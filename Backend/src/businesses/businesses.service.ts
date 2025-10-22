// backend/src/businesses/businesses.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  // Método para obtener negocios públicos - ACTUALIZADO
  async getPublicBusinesses() {
    const prisma = this.prisma as any;
    const businesses = await prisma.negocio.findMany({
      select: {
        id_negocio: true,
        nombre: true,
        direccion: true,
        telefono: true,
        correo: true,
        logo: true,
        fecha_registro: true,
        owner_id: true,
      },
      orderBy: { fecha_registro: 'desc' },
    });

    // Convertir BigInt a Number para la respuesta JSON
    return businesses.map(business => ({
      ...business,
      id_negocio: Number(business.id_negocio),
      owner_id: business.owner_id ? Number(business.owner_id) : null
    }));
  }

  async createBusinessAndAssignOwner(userId: string, dto: CreateBusinessDto) {
    let uid: bigint;
    try { 
      uid = BigInt(userId); 
    } catch { 
      throw new BadRequestException('Usuario inválido'); 
    }
    
    const nombre = dto.nombre?.trim();
    if (!nombre || nombre.length < 2) {
      throw new BadRequestException('Nombre de negocio inválido');
    }

    const prisma = this.prisma as any;
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // Crear el negocio
        const negocio = await tx.negocio.create({
          data: {
            nombre,
            direccion: dto.direccion || null,
            telefono: dto.telefono || null,
            correo: dto.correo || null,
            logo: dto.logo || null,
            fecha_registro: new Date(),
            owner_id: uid, // Asignar el owner directamente
          },
        });

        return negocio;
      });
      
      // Convertir BigInt a Number para la respuesta
      return {
        ...result,
        id_negocio: Number(result.id_negocio),
        owner_id: result.owner_id ? Number(result.owner_id) : null
      };
    } catch (e: any) {
      // Manejo de errores de Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: FK constraint failed
        if (e.code === 'P2003') {
          throw new BadRequestException('No se pudo asignar el usuario al negocio (clave foránea inválida).');
        }
        // P2021: Table not found
        if (e.code === 'P2021') {
          throw new InternalServerErrorException('Esquema de base de datos desactualizado. Ejecuta las migraciones de Prisma.');
        }
        // P2002: Unique constraint failed
        if (e.code === 'P2002') {
          throw new BadRequestException('Ya existe un negocio con ese nombre.');
        }
      }
      console.error('Error creating business:', e);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async listBusinessesForUser(userId: string) {
    let uid: bigint;
    try { 
      uid = BigInt(userId); 
    } catch { 
      throw new BadRequestException('Usuario inválido'); 
    }
    
    const prisma = this.prisma as any;
    const businesses = await prisma.negocio.findMany({
      where: { 
        OR: [
          { owner_id: uid },
          { usuarios_negocio: { some: { id_usuario: uid } } }
        ]
      },
      orderBy: { id_negocio: 'asc' },
    });

    // Convertir BigInt a Number para la respuesta
    return businesses.map(business => ({
      ...business,
      id_negocio: Number(business.id_negocio),
      owner_id: business.owner_id ? Number(business.owner_id) : null
    }));
  }

  async getBusinessById(id: string) {
    let nid: bigint;
    try { 
      nid = BigInt(id); 
    } catch { 
      throw new BadRequestException('ID inválido'); 
    }
    
    const prisma = this.prisma as any;
    const negocio = await prisma.negocio.findUnique({ 
      where: { id_negocio: nid } 
    });
    
    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }
    
    // Convertir BigInt a Number para la respuesta
    return {
      ...negocio,
      id_negocio: Number(negocio.id_negocio),
      owner_id: negocio.owner_id ? Number(negocio.owner_id) : null
    };
  }
}