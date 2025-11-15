# Módulo de Empleados - FilaCero POS

## Descripción General
El módulo de empleados permite a los dueños de negocios gestionar su equipo de trabajo, invitar nuevos empleados, controlar su estado (activo/inactivo) y administrar el acceso al sistema POS.

## Características Principales

### 🎯 Experiencia del Usuario
- **Vista Grid/List**: Cambia entre vista de tarjetas o lista con el atajo `V`
- **Búsqueda en tiempo real**: Busca empleados por nombre o correo electrónico
- **Filtros de estado**: Ver todos, solo activos o solo inactivos
- **Invitación automática**: Si el correo no existe, crea cuenta automáticamente
- **Feedback visual**: Animaciones y estados claros en todas las acciones
- **Keyboard shortcuts**: 
  - `N` - Abrir panel de nuevo empleado
  - `V` - Cambiar vista (grid/list)

### 📊 Estadísticas
- Total de empleados registrados
- Empleados activos
- Empleados inactivos

### ✨ Estados
- **Activo**: Empleado con acceso completo al sistema
- **Inactivo**: Empleado sin acceso (soft delete)

## Backend API

### Endpoints

#### GET `/api/employees/business/:businessId`
Lista todos los empleados de un negocio específico.

**Response:**
```json
[
  {
    "id_empleado": "1",
    "negocio_id": "1",
    "usuario_id": "5",
    "estado": "activo",
    "fecha_alta": "2025-10-28T10:00:00Z",
    "usuario": {
      "id_usuario": "5",
      "nombre": "Juan Pérez",
      "correo_electronico": "juan@ejemplo.com",
      "numero_telefono": "+52 123 456 7890",
      "avatar_url": null,
      "fecha_registro": "2025-10-28T10:00:00Z"
    }
  }
]
```

#### GET `/api/employees/:id`
Obtiene los detalles de un empleado específico.

**Response:**
```json
{
  "id_empleado": "1",
  "negocio_id": "1",
  "usuario_id": "5",
  "estado": "activo",
  "fecha_alta": "2025-10-28T10:00:00Z",
  "usuario": {
    "id_usuario": "5",
    "nombre": "Juan Pérez",
    "correo_electronico": "juan@ejemplo.com",
    "numero_telefono": "+52 123 456 7890",
    "avatar_url": null,
    "fecha_registro": "2025-10-28T10:00:00Z",
    "role": {
      "id_rol": "3",
      "nombre_rol": "empleado"
    }
  },
  "negocio": {
    "id_negocio": "1",
    "nombre": "Mi Negocio"
  }
}
```

#### POST `/api/employees/business/:businessId`
Agrega un nuevo empleado al negocio.

**Request Body:**
```json
{
  "correo_electronico": "nuevo@ejemplo.com",
  "nombre": "María García" // opcional
}
```

**Comportamiento:**
- Si el correo ya existe en el sistema: vincula al usuario existente
- Si el correo NO existe: 
  - Crea un nuevo usuario con rol "empleado"
  - Genera password temporal
  - Marca estado como "pendiente"
  - TODO: Enviar correo de invitación

**Response:**
```json
{
  "id_empleado": "2",
  "negocio_id": "1",
  "usuario_id": "6",
  "estado": "activo",
  "fecha_alta": "2025-10-28T12:00:00Z",
  "usuario": {
    "id_usuario": "6",
    "nombre": "María García",
    "correo_electronico": "nuevo@ejemplo.com",
    "numero_telefono": null,
    "avatar_url": null,
    "fecha_registro": "2025-10-28T12:00:00Z"
  }
}
```

**Errores:**
- `404`: Negocio no encontrado
- `400`: Rol empleado no encontrado en el sistema
- `409`: El usuario ya es empleado de este negocio

#### PATCH `/api/employees/:id`
Actualiza el estado de un empleado.

**Request Body:**
```json
{
  "estado": "inactivo" // o "activo"
}
```

**Response:** Mismo formato que GET `/api/employees/:id`

#### DELETE `/api/employees/:id`
Desactiva un empleado (soft delete, cambia estado a "inactivo").

**Response:**
```json
{
  "message": "Empleado desactivado exitosamente"
}
```

## Frontend

### Estructura de Archivos
```
Frontend/
├── app/pos/staff/
│   └── page.tsx                    # Página principal
├── src/
│   ├── components/pos/employees/
│   │   ├── EmployeesAdminPanel.tsx # Panel con lista de empleados
│   │   ├── EmployeeCard.tsx        # Tarjeta individual
│   │   └── NewEmployeePanel.tsx    # Panel lateral para agregar
│   └── pos/
│       └── employeesStore.tsx      # Store Zustand
```

### Store (Zustand)

```typescript
interface Employee {
  id_empleado: string;
  negocio_id: string;
  usuario_id: string;
  estado: 'activo' | 'inactivo';
  fecha_alta: string;
  usuario: {
    id_usuario: string;
    nombre: string;
    correo_electronico: string;
    numero_telefono?: string | null;
    avatar_url?: string | null;
    fecha_registro: string;
  };
}

// Métodos disponibles:
const { 
  employees,           // Employee[]
  loading,             // boolean
  error,               // string | null
  fetchEmployees,      // (businessId: string) => Promise<void>
  addEmployee,         // (businessId, correo, nombre?) => Promise<Employee>
  updateEmployeeStatus,// (employeeId, estado) => Promise<void>
  removeEmployee       // (employeeId) => Promise<void>
} = useEmployeesStore();
```

### Componentes

#### EmployeesAdminPanel
Panel principal que muestra la lista de empleados con filtros y búsqueda.

**Props:**
- `businessId: string` - ID del negocio
- `search?: string` - Término de búsqueda
- `statusFilter?: 'all' | 'activo' | 'inactivo'` - Filtro de estado
- `view?: 'grid' | 'list'` - Tipo de vista
- `onNewEmployee?: () => void` - Callback al hacer clic en agregar

#### EmployeeCard
Tarjeta individual de empleado con menú de acciones.

**Props:**
- `employee: Employee` - Datos del empleado
- `view: 'grid' | 'list'` - Tipo de vista
- `onUpdate?: () => void` - Callback después de actualizar

**Acciones:**
- Toggle estado (activo/inactivo)
- Eliminar acceso (soft delete)

#### NewEmployeePanel
Panel lateral deslizante para agregar nuevos empleados.

**Props:**
- `businessId: string` - ID del negocio
- `onClose: () => void` - Callback al cerrar
- `onEmployeeCreated?: () => void` - Callback después de crear

**Características:**
- Validación de email en tiempo real
- Nombre opcional
- Info box explicando el proceso de invitación
- Animación de éxito
- Manejo de errores claro

## Base de Datos

### Tabla `empleados`
```sql
CREATE TABLE empleados (
  id_empleado BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id_negocio),
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  estado VARCHAR(20) DEFAULT 'activo',
  fecha_alta TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_empleados_negocio_usuario UNIQUE (negocio_id, usuario_id)
);
```

**Constraints:**
- No se puede duplicar la relación negocio-usuario
- Estado debe ser 'activo' o 'inactivo'

## Casos de Uso

### 1. Agregar primer empleado
1. Usuario hace clic en "Agregar primer empleado"
2. Se abre panel lateral
3. Ingresa correo (requerido) y opcionalmente nombre
4. Sistema verifica si el correo existe:
   - **Si existe**: Vincula usuario al negocio
   - **Si NO existe**: Crea usuario nuevo con rol empleado
5. Muestra confirmación de éxito
6. Cierra panel automáticamente

### 2. Buscar empleado
1. Usuario escribe en el search box
2. Filtra en tiempo real por nombre o correo
3. Muestra mensaje si no hay resultados

### 3. Cambiar estado de empleado
1. Usuario hace clic en menú (⋮) de la tarjeta
2. Selecciona "Activar" o "Desactivar"
3. Sistema actualiza el estado
4. Tarjeta se actualiza visualmente (opacidad, color)

### 4. Filtrar por estado
1. Usuario selecciona filtro: Todos | Activos | Inactivos
2. Lista se actualiza mostrando solo empleados del estado seleccionado
3. Stats se mantienen del total

## Mejoras Futuras

### Backend
- [ ] Implementar envío de correos de invitación
- [ ] Agregar permisos granulares por empleado
- [ ] Historial de cambios de estado
- [ ] Endpoint para reenviar invitación
- [ ] Validación de límite de empleados por plan

### Frontend
- [ ] Paginación para listas grandes
- [ ] Exportar lista de empleados (CSV/PDF)
- [ ] Vista de detalles expandida
- [ ] Filtro por fecha de alta
- [ ] Ordenamiento personalizado
- [ ] Bulk actions (activar/desactivar múltiples)

### Notificaciones
- [ ] Correo al crear empleado
- [ ] Correo al cambiar estado
- [ ] Notificaciones in-app

## Estilo y UX

### Colores
- **Activo**: Verde `#16a34a` con fondo `rgba(34, 197, 94, 0.15)`
- **Inactivo**: Gris `#6b7280` con fondo `rgba(156, 163, 175, 0.15)`
- **Botón principal**: `var(--pos-accent-green)`
- **Avatar placeholder**: `var(--fc-brand-600)` para activos, `#999` para inactivos

### Animaciones
- Slide-in panel: 300ms ease-out
- Success icon scale: 400ms cubic-bezier bounce
- Fade-in overlay: 200ms ease-out
- Hover states: 150ms transitions

### Responsive
- Grid: 1-2-3-4 columnas según viewport
- Search box: full width en móvil
- Panel: full width en móvil, 480px en desktop

## Troubleshooting

### "Error al cargar empleados"
- Verificar que `businessId` sea correcto
- Verificar que el backend esté corriendo
- Revisar CORS si API está en diferente dominio

### "El usuario ya es empleado de este negocio"
- El empleado ya existe en la lista
- Usar filtro "Inactivos" para ver si fue desactivado
- Reactivar en lugar de agregar nuevamente

### Password temporal no llega
- Funcionalidad pendiente de implementar
- Por ahora se imprime en logs del backend
- Buscar `[EMPLEADO CREADO]` en logs

---

**Última actualización**: 28 de octubre de 2025
**Versión**: 1.0.0
