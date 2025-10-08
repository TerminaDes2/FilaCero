# Frontend

## Resumen
Aplicación **Next.js 13** (App Router) con **Tailwind CSS** para la interfaz del punto de venta. Consume la API del backend (`NEXT_PUBLIC_API_BASE`).

## Stack
- Next.js 13.4
- React 18
- Tailwind CSS + PostCSS + Autoprefixer

## Scripts NPM
| Script | Descripción                |
|--------|----------------------------|
| dev    | Desarrollo (hot reload)    |
| build  | Construcción producción    |
| start  | Sirve build                |
| lint   | Linter Next (pendiente conf extendida) |

## Variables de Entorno
En `docker-compose.yml`:
```
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
```
Utilizar siempre el prefijo `NEXT_PUBLIC_` para exponer variables al cliente.

## Estructura (parcial)
```
Frontend/
  app/
    layout.js
    page.js
    globals.css
  public/
  src/ (espacio para componentes / hooks / lib)
  tailwind.config.js
  postcss.config.js
```

## Estilos
- Tailwind configurado vía `tailwind.config.js`.
- Archivo global: `app/globals.css`.

## Comunicación con API
Crear un helper (propuesto) en `src/lib/api.ts`:
```ts
export async function api(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const res = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error('API error');
  return res.json();
}
```

## Estado
Por ahora se recomienda iniciar simple (fetch directo / Server Components). Si se escala, evaluar:
- React Query / TanStack Query
- Zustand o Context API para carrito / sesión

## Tabla de Productos
Para listar productos usar TanStack Table (mencionado en README) — pendiente de instalación:
```
npm i @tanstack/react-table
```

## Accesibilidad y UX (Checklist breve)
- Colores con contraste adecuado
- Focus visible
- Mensajes de error claros
- Loading states en peticiones

## Próximos Componentes (propuesto)
- Barra de búsqueda / filtros
- Carrito rápido
- Panel de ventas activas
- Dashboard con métricas

## Deploy / Build
En Docker (frontend) se expone el puerto 3000 y se monta el código para desarrollo. Para producción se recomienda build multistage y servir sólo `.next` + `node_modules` mínimos.

## Atajos de teclado (POS)

- Buscar: Ctrl/Cmd + K o `/` (enfoca la caja de búsqueda)
- Cambiar vista: V (alterna grid/list)
- Nuevo producto (admin productos): N
- Ir a inicio POS: P
- Ir a configuración: S
- Cerrar sesión: Ctrl/Cmd + L (pide confirmación)
- Confirmar en diálogos: Enter
- Cancelar/cerrar panel o diálogo: Escape
