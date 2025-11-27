# Sistema de Subida de Imágenes de Productos

## Resumen

Sistema completo para subir imágenes de productos a Cloudflare Images, replicando el flujo de avatar de usuarios. Las imágenes se almacenan en Cloudflare y las URLs se guardan en la tabla `producto_media`.

## Arquitectura

### Backend
- **Controlador**: `Backend/src/products/products.controller.ts`
- **Servicio**: `Backend/src/products/products.service.ts`
- **Storage**: Cloudflare Images CDN
- **Base de datos**: Tabla `producto_media` (Prisma)

### Flujo de Datos

1. Admin envía imagen mediante FormData con campo `file`
2. Backend valida el archivo (JPG, PNG, WEBP)
3. Backend sube a Cloudflare Images API
4. Cloudflare devuelve URL pública
5. Backend guarda URL en tabla `producto_media`
6. Al consultar producto, se devuelven todas las URLs de media

## Endpoints

### 1. Crear Producto con Imagen

**POST** `/api/products`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Archivo de imagen (opcional)
- `data`: JSON stringificado con los datos del producto

**Ejemplo de `data` JSON:**
```json
{
  "nombre": "Coca Cola 600ml",
  "descripcion": "Refresco de cola",
  "precio": 15.50,
  "id_categoria": "1",
  "estado": "activo",
  "codigo_barras": "7501234567890"
}
```

**Respuesta exitosa (201):**
```json
{
  "id_producto": "123",
  "nombre": "Coca Cola 600ml",
  "descripcion": "Refresco de cola",
  "precio": 15.50,
  "media": [
    {
      "id_media": "456",
      "url": "https://imagedelivery.net/xxxxx/xxxxx/public",
      "principal": true,
      "tipo": "image/jpeg",
      "creado_en": "2025-11-27T12:00:00Z"
    }
  ],
  "category": "Bebidas",
  "estado": "activo"
}
```

### 2. Agregar Imagen a Producto Existente

**POST** `/api/products/:id/image`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Archivo de imagen (requerido)

**Ejemplo:**
```bash
POST /api/products/123/image
```

**Respuesta exitosa (200):**
```json
{
  "id_producto": "123",
  "nombre": "Coca Cola 600ml",
  "media": [
    {
      "id_media": "456",
      "url": "https://imagedelivery.net/xxxxx/xxxxx/public",
      "principal": true,
      "tipo": "image/jpeg",
      "creado_en": "2025-11-27T12:00:00Z"
    },
    {
      "id_media": "789",
      "url": "https://imagedelivery.net/yyyyy/yyyyy/public",
      "principal": false,
      "tipo": "image/png",
      "creado_en": "2025-11-27T12:05:00Z"
    }
  ]
}
```

## Validaciones

### Tipos de archivo permitidos
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/webp` (.webp)

### Permisos requeridos
- **Crear producto**: `admin`, `superadmin`, `empleado`, `usuario`
- **Agregar imagen**: `admin`, `superadmin`

### Tamaño máximo
- 50 MB (configurado en axios `maxBodyLength`)

## Variables de Entorno Requeridas

```env
# Cloudflare Images Configuration
CLOUDFLARE_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Obtener credenciales de Cloudflare

1. Inicia sesión en [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Ve a **Images** en el menú lateral
3. Copia tu **Account ID**
4. Genera un **API Token** con permisos de **Cloudflare Images:Edit**

## Implementación Técnica

### Método `uploadToCloudflare`

```typescript
private async uploadToCloudflare(file: Express.Multer.File): Promise<string> {
  // 1. Validar archivo
  if (!file || !file.buffer) {
    throw new BadRequestException('Archivo inválido');
  }

  // 2. Obtener credenciales
  const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');

  // 3. Validar tipo de archivo
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    throw new BadRequestException('Tipo de archivo no permitido');
  }

  // 4. Subir a Cloudflare
  const form = new FormData();
  form.append('file', file.buffer, { 
    filename: file.originalname, 
    contentType: file.mimetype 
  });

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const response = await axios.post(url, form, { 
    headers: { 
      Authorization: `Bearer ${apiToken}`, 
      ...form.getHeaders() 
    },
    maxBodyLength: 50 * 1024 * 1024 
  });

  // 5. Extraer URL de la respuesta
  const imageUrl = response.data.result?.variants?.[0] 
    ?? response.data.result?.original_url;

  return imageUrl;
}
```

### Método `uploadProductImage`

```typescript
async uploadProductImage(id: string, file: Express.Multer.File) {
  const productId = BigInt(id);
  
  // 1. Verificar que el producto existe
  await this.findOne(id);
  
  // 2. Subir imagen a Cloudflare
  const imageUrl = await this.uploadToCloudflare(file);
  
  // 3. Guardar URL en producto_media
  await this.prisma.$executeRawUnsafe(
    `INSERT INTO producto_media (id_producto, url, principal, tipo) 
     VALUES ($1, $2, $3, $4)`,
    productId.toString(),
    imageUrl,
    false,
    file.mimetype,
  );
  
  // 4. Devolver producto actualizado
  const refreshed = await this.fetchProductWithRelations(productId);
  return this.mapProduct(refreshed);
}
```

## Tabla `producto_media`

```sql
CREATE TABLE producto_media (
  id_media    BIGSERIAL PRIMARY KEY,
  id_producto BIGINT REFERENCES producto(id_producto) ON DELETE CASCADE,
  url         VARCHAR(2048) NOT NULL,
  principal   BOOLEAN DEFAULT false,
  tipo        VARCHAR(30),
  creado_en   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Campo `principal`
- Solo una imagen por producto puede ser `principal: true`
- La primera imagen agregada se marca como principal automáticamente
- Se usa para mostrar la imagen destacada en listados

## Ejemplo Frontend (React/Next.js)

### Crear producto con imagen

```typescript
const createProductWithImage = async (productData, imageFile) => {
  const formData = new FormData();
  
  // Agregar archivo
  formData.append('file', imageFile);
  
  // Agregar datos del producto como JSON stringificado
  formData.append('data', JSON.stringify({
    nombre: productData.nombre,
    descripcion: productData.descripcion,
    precio: productData.precio,
    id_categoria: productData.id_categoria,
    estado: 'activo'
  }));

  const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
};
```

### Agregar imagen a producto existente

```typescript
const addProductImage = async (productId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch(
    `http://localhost:3000/api/products/${productId}/image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return response.json();
};
```

### Mostrar imágenes de producto

```tsx
const ProductImage = ({ product }) => {
  // Buscar la imagen principal
  const mainImage = product.media?.find(m => m.principal);
  
  // Fallback a la primera imagen o a un placeholder
  const imageUrl = mainImage?.url 
    ?? product.media?.[0]?.url 
    ?? '/placeholder-product.png';

  return (
    <img 
      src={imageUrl} 
      alt={product.nombre}
      className="w-full h-auto"
    />
  );
};
```

## Migración desde Sistema Anterior

Si tenías imágenes guardadas localmente en `/uploads`:

1. Las URLs antiguas se mapean automáticamente en `mapProduct()`
2. Para migrar a Cloudflare:
   - Usa el endpoint `/api/products/:id/image` para cada producto
   - O ejecuta un script de migración que:
     - Lea archivos de `/uploads`
     - Los suba uno por uno usando el servicio
     - Actualice las referencias en la BD

## Errores Comunes

### Error: "Configuración de Cloudflare no definida"
**Causa**: Faltan variables de entorno  
**Solución**: Verificar que `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` estén configuradas

### Error: "Tipo de archivo no permitido"
**Causa**: Intento de subir archivo que no es imagen  
**Solución**: Solo enviar JPG, PNG o WEBP

### Error: "No tienes permiso para modificar"
**Causa**: Usuario sin rol de admin/superadmin  
**Solución**: Verificar permisos del usuario

## Ventajas vs. Almacenamiento Local

✅ **CDN Global**: Imágenes servidas desde servidores cercanos al usuario  
✅ **Sin gestión de archivos**: No necesitas limpiar `/uploads`  
✅ **Optimización automática**: Cloudflare optimiza y redimensiona imágenes  
✅ **Alta disponibilidad**: 99.9% uptime garantizado  
✅ **Variantes**: Cloudflare genera múltiples tamaños automáticamente  
✅ **Seguridad**: URLs firmadas y protección anti-hotlinking  

## Próximos Pasos

- [ ] Implementar eliminación de imágenes de Cloudflare al borrar producto
- [ ] Agregar endpoint para marcar/desmarcar imagen como principal
- [ ] Implementar crop/resize en frontend antes de subir
- [ ] Agregar límite de imágenes por producto
- [ ] Implementar galería de imágenes en detalle de producto
