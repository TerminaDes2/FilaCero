# Ejemplos de Uso - Subida de Imágenes de Productos

## Requisitos Previos

1. Tener un token JWT válido
2. Tener permisos de `admin` o `superadmin`
3. Variables de entorno de Cloudflare configuradas en el backend

## Ejemplos con cURL

### 1. Crear producto CON imagen

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F 'file=@/ruta/a/tu/imagen.jpg' \
  -F 'data={
    "nombre": "Coca Cola 600ml",
    "descripcion": "Refresco de cola 600ml",
    "precio": 15.50,
    "id_categoria": "1",
    "estado": "activo",
    "codigo_barras": "7501234567890"
  }'
```

### 2. Crear producto SIN imagen

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F 'data={
    "nombre": "Agua Natural 1L",
    "descripcion": "Agua embotellada",
    "precio": 10.00,
    "id_categoria": "1",
    "estado": "activo"
  }'
```

### 3. Agregar imagen a producto existente

```bash
curl -X POST http://localhost:3000/api/products/123/image \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F 'file=@/ruta/a/otra/imagen.png'
```

## Ejemplos con JavaScript/TypeScript

### React con Axios

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

// Crear producto con imagen
const createProduct = async (productData: any, imageFile: File) => {
  const formData = new FormData();
  
  // Agregar archivo (opcional)
  if (imageFile) {
    formData.append('file', imageFile);
  }
  
  // Agregar datos como JSON string
  formData.append('data', JSON.stringify({
    nombre: productData.nombre,
    descripcion: productData.descripcion,
    precio: Number(productData.precio),
    id_categoria: productData.id_categoria,
    estado: productData.estado || 'activo',
    codigo_barras: productData.codigo_barras
  }));

  try {
    const response = await axios.post(`${API_URL}/products`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Producto creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

// Agregar imagen a producto existente
const addProductImage = async (productId: string, imageFile: File) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await axios.post(
      `${API_URL}/products/${productId}/image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('Imagen agregada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al agregar imagen:', error);
    throw error;
  }
};

// Uso en un componente
const ProductForm = () => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      nombre: 'Coca Cola 600ml',
      descripcion: 'Refresco de cola',
      precio: 15.50,
      id_categoria: '1',
      estado: 'activo',
      codigo_barras: '7501234567890'
    };
    
    const imageInput = document.getElementById('image') as HTMLInputElement;
    const imageFile = imageInput?.files?.[0];
    
    if (imageFile) {
      await createProduct(productData, imageFile);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input id="image" type="file" accept="image/*" />
      <button type="submit">Crear Producto</button>
    </form>
  );
};
```

### Next.js con fetch

```typescript
// app/admin/products/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createProductWithImage(formData: FormData) {
  const token = // obtener token de cookies o sesión
  
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear producto');
    }

    const product = await response.json();
    
    // Revalidar cache de Next.js
    revalidatePath('/admin/products');
    
    return { success: true, product };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}
```

```tsx
// app/admin/products/create/page.tsx
'use client';

import { useState } from 'react';
import { createProductWithImage } from '../actions';

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData();

    // Agregar archivo
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput.files?.[0]) {
      formData.append('file', fileInput.files[0]);
    }

    // Agregar datos como JSON string
    const productData = {
      nombre: (form.querySelector('[name="nombre"]') as HTMLInputElement).value,
      descripcion: (form.querySelector('[name="descripcion"]') as HTMLTextAreaElement).value,
      precio: Number((form.querySelector('[name="precio"]') as HTMLInputElement).value),
      id_categoria: (form.querySelector('[name="id_categoria"]') as HTMLSelectElement).value,
      estado: 'activo',
      codigo_barras: (form.querySelector('[name="codigo_barras"]') as HTMLInputElement).value
    };

    formData.append('data', JSON.stringify(productData));

    try {
      const result = await createProductWithImage(formData);
      
      if (result.success) {
        alert('Producto creado exitosamente');
        form.reset();
        setPreview(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error al crear producto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Crear Producto</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Imagen del Producto</label>
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="block w-full"
          />
          {preview && (
            <img 
              src={preview} 
              alt="Preview" 
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <div>
          <label className="block mb-2">Nombre</label>
          <input 
            type="text" 
            name="nombre" 
            required 
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Descripción</label>
          <textarea 
            name="descripcion" 
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-2">Precio</label>
          <input 
            type="number" 
            name="precio" 
            step="0.01" 
            required 
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Categoría</label>
          <select 
            name="id_categoria" 
            required 
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Seleccionar...</option>
            <option value="1">Bebidas</option>
            <option value="2">Alimentos</option>
            <option value="3">Snacks</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Código de Barras</label>
          <input 
            type="text" 
            name="codigo_barras" 
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Producto'}
        </button>
      </form>
    </div>
  );
}
```

## Ejemplos con Python

### Requests

```python
import requests
import json

API_URL = 'http://localhost:3000/api'
TOKEN = 'tu_token_jwt'

def create_product_with_image(product_data, image_path):
    """Crear producto con imagen"""
    
    headers = {
        'Authorization': f'Bearer {TOKEN}'
    }
    
    # Preparar datos
    files = {
        'file': open(image_path, 'rb'),
        'data': (None, json.dumps(product_data))
    }
    
    try:
        response = requests.post(
            f'{API_URL}/products',
            headers=headers,
            files=files
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.HTTPError as err:
        print(f'Error HTTP: {err}')
        print(f'Response: {err.response.text}')
        raise

def add_product_image(product_id, image_path):
    """Agregar imagen a producto existente"""
    
    headers = {
        'Authorization': f'Bearer {TOKEN}'
    }
    
    files = {
        'file': open(image_path, 'rb')
    }
    
    try:
        response = requests.post(
            f'{API_URL}/products/{product_id}/image',
            headers=headers,
            files=files
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.HTTPError as err:
        print(f'Error HTTP: {err}')
        print(f'Response: {err.response.text}')
        raise

# Uso
if __name__ == '__main__':
    product_data = {
        'nombre': 'Coca Cola 600ml',
        'descripcion': 'Refresco de cola',
        'precio': 15.50,
        'id_categoria': '1',
        'estado': 'activo',
        'codigo_barras': '7501234567890'
    }
    
    result = create_product_with_image(
        product_data, 
        './imagenes/coca-cola.jpg'
    )
    
    print('Producto creado:', result)
    
    # Agregar otra imagen al mismo producto
    product_id = result['id_producto']
    add_product_image(product_id, './imagenes/coca-cola-back.jpg')
```

## Mostrar Imágenes en el Frontend

### React Component

```tsx
interface ProductImageProps {
  product: {
    nombre: string;
    media?: Array<{
      id_media: string;
      url: string;
      principal: boolean;
      tipo: string | null;
    }>;
  };
}

const ProductImage: React.FC<ProductImageProps> = ({ product }) => {
  // Buscar imagen principal o usar la primera
  const mainImage = product.media?.find(m => m.principal);
  const imageUrl = mainImage?.url ?? product.media?.[0]?.url;

  if (!imageUrl) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">Sin imagen</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl}
      alt={product.nombre}
      className="w-full h-48 object-cover rounded"
      onError={(e) => {
        e.currentTarget.src = '/placeholder-product.png';
      }}
    />
  );
};

// Galería de imágenes
const ProductGallery: React.FC<ProductImageProps> = ({ product }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  if (!product.media || product.media.length === 0) {
    return <div>Sin imágenes</div>;
  }

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <img 
        src={product.media[selectedIndex].url}
        alt={product.nombre}
        className="w-full h-96 object-cover rounded-lg"
      />
      
      {/* Miniaturas */}
      <div className="flex gap-2 overflow-x-auto">
        {product.media.map((img, idx) => (
          <button
            key={img.id_media}
            onClick={() => setSelectedIndex(idx)}
            className={`
              flex-shrink-0 w-20 h-20 rounded border-2
              ${selectedIndex === idx ? 'border-blue-500' : 'border-gray-300'}
            `}
          >
            <img 
              src={img.url}
              alt={`${product.nombre} - ${idx + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
```

## Errores Comunes y Soluciones

### Error 400: "Archivo inválido o vacío"

**Causa**: No se envió el archivo o está corrupto

**Solución**:
```javascript
// Verificar que el archivo existe antes de enviarlo
if (!file || file.size === 0) {
  alert('Por favor selecciona una imagen válida');
  return;
}
```

### Error 400: "Tipo de archivo no permitido"

**Causa**: El archivo no es JPG, PNG o WEBP

**Solución**:
```html
<!-- Restringir tipos de archivo en el input -->
<input 
  type="file" 
  accept="image/jpeg,image/png,image/webp"
/>
```

### Error 401: "No tienes permiso"

**Causa**: Token inválido o usuario sin permisos de admin

**Solución**:
- Verificar que el token sea válido
- Verificar que el usuario tenga rol `admin` o `superadmin`

### Error 500: "Configuración de Cloudflare no definida"

**Causa**: Variables de entorno no configuradas

**Solución**:
```bash
# Agregar en .env del backend
CLOUDFLARE_ACCOUNT_ID=tu_account_id
CLOUDFLARE_API_TOKEN=tu_api_token
```

## Testing

### Test con Jest

```typescript
describe('ProductsController', () => {
  it('should upload product image', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
      size: 1024,
      // ... otros campos requeridos
    };

    const result = await controller.uploadProductImage('123', mockFile);
    
    expect(result).toHaveProperty('id_producto');
    expect(result.media).toHaveLength(1);
    expect(result.media[0].url).toContain('cloudflare');
  });
});
```
