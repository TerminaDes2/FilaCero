# APIs - Documentación de Endpoints

Esta carpeta contiene la documentación de todos los endpoints REST del backend FilaCero.

## Contenido

### [API Businesses](./API_Businesses.md)
Documentación del módulo de negocios:
- GET `/api/businesses` - Listar negocios
- POST `/api/businesses` - Crear negocio
- GET `/api/businesses/:id` - Obtener negocio
- PATCH `/api/businesses/:id` - Actualizar negocio
- DELETE `/api/businesses/:id` - Eliminar negocio

### [API Categorías](./API_Categorias.md)
CRUD completo de categorías de productos:
- GET `/api/categories` - Listar categorías
- POST `/api/categories` - Crear categoría
- GET `/api/categories/:id` - Obtener categoría
- PATCH `/api/categories/:id` - Actualizar categoría
- DELETE `/api/categories/:id` - Eliminar categoría

### [API Productos](./API_Productos.md)
Gestión del catálogo de productos:
- GET `/api/products` - Listar productos (con filtros)
- POST `/api/products` - Crear producto
- GET `/api/products/:id` - Obtener producto
- PATCH `/api/products/:id` - Actualizar producto
- DELETE `/api/products/:id` - Eliminar producto
- GET `/api/products/:id/history` - Historial de precios

### [API SMS](./API_SMS.md)
Servicio de mensajería SMS:
- POST `/api/sms/send` - Enviar SMS
- GET `/api/sms/status/:id` - Estado de SMS
- GET `/api/sms/history` - Historial de mensajes

### [API Usuarios](./API_Usuarios.md)
Autenticación y gestión de usuarios:
- POST `/api/auth/register` - Registro de usuario
- POST `/api/auth/login` - Inicio de sesión
- POST `/api/auth/refresh` - Refrescar token
- GET `/api/users/me` - Perfil del usuario
- PATCH `/api/users/:id` - Actualizar usuario
- GET `/api/users` - Listar usuarios (admin)

### [API Ventas](./API_Ventas.md)
Sistema de ventas y transacciones:
- POST `/api/sales` - Registrar venta
- GET `/api/sales` - Listar ventas
- GET `/api/sales/:id` - Detalle de venta
- POST `/api/sales/:id/refund` - Reembolso
- GET `/api/sales/report` - Reportes de ventas

## Convenciones

Todos los endpoints siguen estas convenciones:
- **Autenticación**: Bearer token en header `Authorization`
- **Formato**: JSON para request y response bodies
- **Paginación**: Query params `page` y `limit` donde aplique
- **Filtros**: Query params específicos por recurso
- **Códigos HTTP**: 
  - 200 OK (éxito)
  - 201 Created (creación)
  - 400 Bad Request (validación)
  - 401 Unauthorized (sin auth)
  - 403 Forbidden (sin permisos)
  - 404 Not Found (recurso no existe)
  - 500 Internal Server Error (error servidor)

## Swagger/OpenAPI

La documentación interactiva está disponible en:
- **Desarrollo**: http://localhost:3000/api/docs
- **Producción**: https://api.filacero.com/api/docs

[← Volver al índice principal](../README.md)
