# Testing - Documentación de Pruebas

Esta carpeta contiene documentación sobre testing, casos de prueba y estrategias de QA.

## Contenido

### [TEST_BUSINESS_RATINGS.md](./TEST_BUSINESS_RATINGS.md)
Suite de pruebas del módulo de calificaciones:
- Tests unitarios del servicio
- Tests E2E de endpoints
- Casos de prueba manual
- Cobertura y resultados

## Estrategia de Testing

### Pirámide de Testing
```
        ╱╲
       ╱E2E╲         10% - Tests de integración completos
      ╱────╲
     ╱ INT  ╲        20% - Tests de integración de módulos
    ╱────────╲
   ╱  UNIT    ╲      70% - Tests unitarios de lógica de negocio
  ╱────────────╲
```

### Niveles de Testing

#### 1. Tests Unitarios (70%)
- **Framework**: Jest
- **Scope**: Funciones puras, servicios, utilidades
- **Ubicación**: `*.spec.ts` junto al archivo fuente
- **Mock**: Todas las dependencias externas

Ejemplo:
```typescript
// payments.service.spec.ts
describe('PaymentsService', () => {
  it('should create payment intent successfully', async () => {
    const result = await service.createPaymentIntent(mockData);
    expect(result.clientSecret).toBeDefined();
  });
});
```

#### 2. Tests de Integración (20%)
- **Framework**: Jest + Supertest
- **Scope**: Módulos completos con dependencias reales
- **Ubicación**: `test/*.e2e-spec.ts`
- **Mock**: Solo servicios externos (Stripe, email, SMS)

Ejemplo:
```typescript
// payments.e2e-spec.ts
it('/api/payments/create-intent (POST)', () => {
  return request(app.getHttpServer())
    .post('/api/payments/create-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ pedidoId: 1, metodoPago: 'card' })
    .expect(201)
    .expect((res) => {
      expect(res.body.clientSecret).toBeDefined();
    });
});
```

#### 3. Tests E2E (10%)
- **Framework**: Playwright (futuro)
- **Scope**: Flujos completos usuario → UI → API → DB
- **Ubicación**: `e2e/` en raíz
- **Mock**: Nada (usa staging environment)

## Comandos de Testing

### Backend

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:cov

# Solo tests E2E
npm run test:e2e

# Tests de un archivo específico
npm test -- payments.service.spec.ts

# Tests con debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend

```bash
# Ejecutar tests de componentes
npm test

# Tests con cobertura
npm run test:coverage

# Tests específicos
npm test -- ProductCard.test.tsx
```

## Cobertura de Testing

### Objetivo Mínimo
- **Servicios críticos**: 90% (payments, auth, pedidos)
- **Servicios estándar**: 70% (productos, categorías)
- **Controladores**: 60% (principalmente E2E)
- **Utilidades**: 80%

### Reporte de Cobertura

```bash
npm run test:cov
```

Genera reporte HTML en `coverage/lcov-report/index.html`:
- Líneas cubiertas
- Branches cubiertos
- Funciones cubiertas
- Archivos sin cobertura

### Estado Actual

| Módulo | Unit | E2E | Cobertura |
|--------|------|-----|-----------|
| Payments | ✅ 11 tests | ✅ 10 tests | 92% |
| Business Ratings | ✅ 15 tests | ✅ 8 tests | 88% |
| Pedidos | 🟡 5 tests | ❌ - | 45% |
| Products | ❌ - | ❌ - | 0% |
| Auth | 🟡 3 tests | ❌ - | 30% |

## Tests Manuales

### Herramientas
- **Postman/Thunder Client**: Tests de API
- **Swagger UI**: Exploración interactiva
- **Browser DevTools**: Frontend debugging

### Colecciones de Thunder Client

Ver: `Backend/test/FilaCero-Payments.thunder-collection.json`

Folders:
1. **Auth**: Login, registro
2. **Pedidos**: Crear pedido de prueba
3. **Payments**: PaymentIntent, webhooks
4. **Methods**: Guardar/listar tarjetas
5. **Metrics**: Observabilidad

### Guía de Testing Manual

Ver: `Backend/test/MANUAL_TESTING_GUIDE.md`

Escenarios cubiertos:
- Flujo completo de pago
- Webhooks simulados
- Validaciones de seguridad
- Feature flags
- Rate limiting

## Queries de Validación SQL

Ver: `Backend/test/payment-validation-queries.sql`

Queries para verificar:
- Transacciones creadas correctamente
- Estados de pedidos actualizados
- Métodos de pago guardados
- Métricas de pagos

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:cov
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Mejores Prácticas

### 1. Naming
```typescript
describe('PaymentsService', () => {
  describe('createPaymentIntent', () => {
    it('should create intent with valid data', () => {});
    it('should throw NotFoundException if pedido not found', () => {});
    it('should throw ForbiddenException if user unauthorized', () => {});
  });
});
```

### 2. Arrange-Act-Assert
```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10, quantity: 2 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(20);
});
```

### 3. Tests Independientes
```typescript
beforeEach(async () => {
  // Reset database state
  await prisma.transaccionPago.deleteMany();
  await prisma.pedido.deleteMany();
});
```

### 4. Mock Apropiado
```typescript
// Mock solo lo necesario
const mockStripeService = {
  createPaymentIntent: jest.fn().mockResolvedValue(mockIntent),
  // No mockear métodos no usados
};
```

## Testing de Features Nuevas

Checklist para nuevas implementaciones:

- [ ] Tests unitarios del servicio (>70% cobertura)
- [ ] Tests E2E de endpoints principales
- [ ] Casos de error manejados
- [ ] Validaciones de DTOs
- [ ] Colección Thunder Client actualizada
- [ ] Queries SQL de validación
- [ ] Documentación en esta carpeta

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

[← Volver al índice principal](../README.md)
