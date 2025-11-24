# Subida de imágenes a Cloudinary (Cliente)

Este documento explica cómo configurar Cloudinary para permitir subidas desde el cliente (Next.js) usadas por el flujo de verificación de credencial.

## Resumen
- En el frontend usamos variables públicas para indicar el `cloud name` y el `upload preset`.
- Si subes directamente desde el navegador el `upload preset` debe ser `unsigned`.
- Para mayor seguridad, genera firmas en el backend (signed uploads).

## Variables de entorno (Frontend)

Añade en `Frontend/.env.local` (no commitear) las siguientes variables:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset_aqui
```

Ejemplo:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=mi_cuenta_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=filacero_unsigned_preset
```

Después de cambiar estas variables, reinicia el servidor de desarrollo:

```powershell
# desde la carpeta Frontend
npm run dev
```

## Crear `upload preset` en Cloudinary (unsigned)

1. Entra en tu Dashboard de Cloudinary.
2. Ve a `Settings` → `Upload` → `Upload presets`.
3. Crea un nuevo preset y en las opciones selecciona `Unsigned` si vas a permitir subidas desde el navegador.
4. Copia el nombre del preset y ponlo en `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

Atención: un preset `unsigned` permite a cualquiera subir conociendo `cloud name` y `preset`. Si esto no es aceptable, usa uploads firmados.

## Ejemplo de uso (Next.js cliente)

El frontend usa `process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` para construir la URL de subida.

Snippet (fetch):

```ts
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Configura las variables de entorno');

const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', UPLOAD_PRESET);

const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const res = await fetch(url, { method: 'POST', body: formData });
if (!res.ok) throw new Error(`Cloudinary error ${res.status}: ${await res.text()}`);
const data = await res.json();
console.log(data.secure_url);
```

## Subida firmada (opción más segura)

Si no quieres `unsigned` uploads, genera `signature` y `timestamp` en el backend y envíalos al cliente. Ejemplo minimal en Node/Express (backend):

```js
// Endpoint: /api/cloudinary-sign
const crypto = require('crypto');
app.get('/api/cloudinary-sign', (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET; // solo en backend
  const paramsToSign = `timestamp=${timestamp}`; // añade otros params si los usas
  const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
  res.json({ signature, timestamp });
});
```

En el cliente añade `signature` y `timestamp` al `FormData` antes de subir.

## Diagnóstico de errores comunes
- 401 Unauthorized: cloud name incorrecto, preset inexistente, o preset requiere firma.
- Respuesta con texto desde Cloudinary: ahora el frontend muestra el body y el código HTTP para depurar.

## Recomendación
- Para desarrollo rápido usa `unsigned` pero limita el tamaño y el tipo de archivos.
- Para producción implementa subida firmada en el backend.
