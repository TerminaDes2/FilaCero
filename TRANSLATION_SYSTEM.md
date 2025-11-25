# Sistema de Traducción FilaCero

## Descripción
Sistema dinámico de traducciones con soporte para **ES (MX)** y **EN (US)** usando Azure Translator API.

## Arquitectura

### Backend
- **Módulo**: `Backend/src/translation/`
- **Endpoint**: `POST /api/translation/translate`
- **Caché**: En memoria (Map) para optimizar llamadas repetidas
- **Servicio**: Azure Cognitive Services Translator

### Frontend
- **Store**: Zustand (`languageStore.ts`) - Maneja locale actual
- **Hook**: `useTranslation()` - Para textos estáticos locales
- **Utilidad**: `translateDynamic()` - Para contenido de BD (productos, etc)
- **Selector**: Emoji 🌍 en navbar (desktop y mobile)

## Configuración

### Variables de Entorno (Backend .env)
```env
AZURE_TRANSLATOR_KEY=tu_api_key
AZURE_TRANSLATOR_REGION=southcentralus
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

## Uso

### Textos Estáticos (UI)
```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('navbar.home')}</h1>;
}
```

### Contenido Dinámico (BD)
```tsx
import { translateDynamic } from '@/lib/translateDynamic';
import { useLanguageStore } from '@/state/languageStore';

const { locale } = useLanguageStore();
const productos = await getProductos();
const names = productos.map(p => p.nombre);
const translated = await translateDynamic(names, locale);
```

## Flujo de Traducción

1. **Usuario cambia idioma** → Click en 🌍
2. **Store actualiza** → `locale` cambia de `es-MX` a `en-US`
3. **Componentes re-renderizan** → Hook `useTranslation()` devuelve textos en nuevo idioma
4. **Contenido dinámico** → Se llama a `/api/translation/translate` con textos en español
5. **Azure traduce** → Responde con traducciones en inglés
6. **Caché** → Traducciones se guardan en memoria para evitar re-llamadas

## Archivos Clave

### Backend
- `translation.service.ts` - Lógica de llamada a Azure
- `translation.controller.ts` - Endpoint REST
- `translation.module.ts` - Módulo NestJS

### Frontend
- `languageStore.ts` - State global de idioma
- `useTranslation.ts` - Hook para textos estáticos
- `translateDynamic.ts` - Función para contenido de BD
- `LanguageInitializer.tsx` - Restaura preferencia guardada
- `locales/es-MX.json` - Textos en español
- `locales/en-US.json` - Textos en inglés

## Selector de Idioma
- **Ubicación**: Navbar (componente `navbar.tsx`)
- **Icono**: 🌍 (emoji mundo)
- **Desktop**: Botón inline con texto "ES" o "EN"
- **Mobile**: Botón completo en menú hamburguesa
- **Persistencia**: localStorage (`language-locale`)

## Idioma por Defecto
- **Español (es-MX)** - Todos los textos y contenido base están en español
- Cambio a inglés solo cuando usuario selecciona desde selector
