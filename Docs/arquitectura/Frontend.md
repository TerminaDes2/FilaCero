# Frontend

## Resumen
La interfaz de FilaCero está construida con **Next.js 13 App Router**, **React 18** y **Tailwind CSS**. El objetivo principal es ofrecer un onboarding guiado y un POS multinegocio. Las llamadas al backend se realizan mediante `fetch` encapsulado en utilidades (`src/lib/api.ts`) y el estado compartido se maneja con **Zustand**.

## Stack y tooling
- Next.js 13.5 (App Router, Server/Client Components).
- React 18 con Suspense progresivo.
- Tailwind CSS (config extendida en `tailwind.config.js`).
- Zustand para stores (`src/pos/categoriesStore.ts`, `src/state/userStore.ts`).
- React Hook Form + Zod para validaciones embebidas en wizard de onboarding.

## Scripts npm
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Construcción para producción |
| `npm run start` | Sirve el build |
| `npm run lint` | Linter Next + reglas personalizadas |

## Variables de entorno relevantes
```
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
NEXT_PUBLIC_NEGOCIO_ID=<opcional para preseleccionar negocio>
```
Todas las variables expuestas al cliente deben iniciar con `NEXT_PUBLIC_`. Durante desarrollo Docker, `NEXT_PUBLIC_API_BASE` apunta al backend interno.

## Despliegue en Railway
- Configura variables en el servicio de Frontend:
  - `NEXT_PUBLIC_API_BASE`: URL pública del backend incluyendo `/api`. Ej.: `https://<tu-backend>.up.railway.app/api`.
  - `NODE_OPTIONS`: `--dns-result-order=ipv4first` para evitar conexiones a `::1` que pueden ser rechazadas.
- Asegura que el servicio de Backend esté público o accesible desde el Frontend.
- El build usa `output: 'standalone'` para reducir IPC interno de Next en producción.

## Estructura actual
```
Frontend/
  app/
    layout.tsx            # Layout raíz App Router
    page.tsx              # Landing pública
    auth/                 # Login, registro, recuperaciones
    onboarding/           # Wizard multi-paso (owner -> negocio)
    pos/                  # Terminal de punto de venta
    productos/            # Administración de catálogo y categorías
    shop/                 # Vistas públicas en progreso
  src/
    components/           # UI y bloques de formulario reutilizables
    features/             # Lógica específica (auth, pos, legal)
    lib/api.ts            # Wrapper fetch + helpers para tokens
    state/                # Stores Zustand (usuario, settings, modales)
  public/                 # Imágenes y assets
  tailwind.config.js
  postcss.config.js
```

## Formularios y flujos principales
- **Registro y login (`app/auth`)**: formularios responsivos con validación en cliente. El formulario de registro adapta campos opcionales para dueños (razón social, teléfono) y estudiantes (número de cuenta) ocultando inputs según selección.
- **Onboarding de negocio (`BusinessOnboardingWizard`)**: 4 pasos (datos generales, branding, dirección, horarios). El wizard se puede incrustar (`embed`) y guarda progreso en estado local para evitar pérdida accidental.
- **Gestión de categorías (`app/productos/categorias`)**: Panel CRUD que diferencia categorías globales (solo lectura) de las propias del negocio. Usa `useCategoriesStore` para sincronizar con el backend.
- **Inventario (`app/pos/inventory`)**: Formularios para alta rápida de existencias por negocio. Muestran validaciones cuando falta negocio activo y llaman a `/api/inventory`.
- **POS (`app/pos`)**: Permite seleccionar categoría, buscar productos, gestionar carrito y registrar venta. Incluye formularios modales para aplicar descuentos y seleccionar método de pago.
- **Tienda pública (`app/shop`)**: Consume `app/api/stores` para mostrar negocios disponibles, secciones destacadas y carrito ligero.

## Estado compartido
- `activeBusiness` (en `src/lib/api.ts`) almacena el negocio seleccionado y se sincroniza con `localStorage`.
- `useCategoriesStore` mantiene categorías cargadas desde `/api/categories?id_negocio=...`, conserva categorías globales y evita duplicados.
- `useUserStore` guarda payload del JWT (rol, verificación, negocio por defecto) para hidratar componentes cliente.
- `posSettingsStore` controla densidad, tema y atajos con persistencia local.

## Estilos y diseño
- Tailwind se complementa con tokens CSS (`--pos-control-h`, `--pos-accent-*`) aplicados por `ClientSettingsApplier`.
- Layouts usan CSS Grid para dividir onboarding (beneficios + formulario) y el POS (panel principal + laterales).
- Se mantiene contraste AA/AAA y focus visibles; cada formulario muestra mensajes contextualizados.

## Integración con la API
- `src/lib/api.ts` centraliza métodos (`getCategories`, `createCategory`, `getInventory`, etc.) y adjunta encabezados JWT.
- Cada llamada requiere negocio activo cuando la lógica lo demanda; el store lanza mensajes en español cuando faltan datos.
- Se propaga el error nativo del backend para que el frontend muestre feedback coherente (p. ej. duplicados de categoría).

## Próximos ajustes
- Consolidar un hook de negocio activo para evitar acceso directo a `activeBusiness`.
- Generar documentación UI de componentes en `Docs/Frontend-UI.md` (pendiente).
- Integrar pruebas de interacción (Playwright) para checkout POS y onboarding.
