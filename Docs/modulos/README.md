# Módulos - Documentación por Funcionalidad

Esta carpeta contiene la documentación específica de módulos individuales del sistema.

## Contenido

### [Modulo_Empleados.md](./Modulo_Empleados.md)
Sistema de gestión de personal:
- Registro de empleados
- Roles y permisos
- Horarios y turnos
- Historial de actividad
- Reportes de desempeño

**Estado**: 🟡 En desarrollo  
**Endpoints**: `/api/employees/*`  
**Prioridad**: Alta

### [implementaciones-negocio-rating.md](./implementaciones-negocio-rating.md)
Sistema de calificaciones de negocios:
- Modelo de ratings (1-5 estrellas)
- Comentarios y reseñas
- Promedio ponderado
- Moderación de contenido
- API pública

**Estado**: ✅ Completo  
**Endpoints**: `/api/business-ratings/*`  
**Testing**: Ver [TEST_BUSINESS_RATINGS.md](../testing/TEST_BUSINESS_RATINGS.md)

### [feedback-modulo.md](./feedback-modulo.md)
Retroalimentación general sobre implementación de módulos:
- Lecciones aprendidas
- Mejores prácticas identificadas
- Patrones a replicar
- Antipatrones a evitar
- Sugerencias de refactorización

## Estructura Estándar de Módulos

Cada módulo en FilaCero sigue esta estructura:

```
Backend/src/<modulo>/
├── <modulo>.module.ts       # Definición del módulo NestJS
├── <modulo>.controller.ts   # Controlador REST
├── <modulo>.service.ts      # Lógica de negocio
├── dto/
│   ├── create-<entity>.dto.ts
│   ├── update-<entity>.dto.ts
│   └── query-<entity>.dto.ts
├── entities/              # Solo si usa TypeORM
│   └── <entity>.entity.ts
└── <modulo>.service.spec.ts # Tests unitarios
```

## Convenciones de Implementación

### 1. Controller
```typescript
@Controller('api/<recurso>')
@UseGuards(JwtAuthGuard)
export class ModuloController {
  @Get()
  @ApiOperation({ summary: 'Listar recursos' })
  findAll(@Query() query: QueryDto) {}
  
  @Post()
  @ApiOperation({ summary: 'Crear recurso' })
  create(@Body() dto: CreateDto) {}
}
```

### 2. Service
```typescript
@Injectable()
export class ModuloService {
  constructor(private prisma: PrismaService) {}
  
  async findAll(query: QueryDto) {
    return this.prisma.entity.findMany({...});
  }
  
  async create(dto: CreateDto) {
    return this.prisma.entity.create({...});
  }
}
```

### 3. DTOs
```typescript
export class CreateDto {
  @IsString()
  @ApiProperty()
  nombre: string;
  
  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  orden?: number;
}
```

## Módulos Planificados

| Módulo | Descripción | Prioridad | Estado |
|--------|-------------|-----------|--------|
| Empleados | Gestión de personal | Alta | 🟡 En desarrollo |
| Proveedores | Catálogo de proveedores | Media | ❌ Pendiente |
| Compras | Órdenes de compra | Media | ❌ Pendiente |
| Reportes | Analytics avanzados | Baja | ❌ Pendiente |
| Notificaciones | Email/SMS/Push | Alta | ❌ Pendiente |

[← Volver al índice principal](../README.md)
