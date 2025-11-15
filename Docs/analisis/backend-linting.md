# Configuración de linting en Backend

## Scripts disponibles
- `npm run lint`: ejecuta ESLint sobre `src/**/*.{ts,tsx}`.

## Toolchain instalada
- `eslint` 9.x con configuración plana (`eslint.config.mjs`).
- Paquetes de soporte para TypeScript: `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `typescript-eslint`.

## Configuración (`eslint.config.mjs`)
- Ignora directorios `dist`, `node_modules`, `generated`.
- Extiende reglas recomendadas de JavaScript y TypeScript con verificación basada en tipos.
- Fuerza el uso de `@typescript-eslint/no-misused-promises` (permitiendo atributos `void`) y `@typescript-eslint/no-floating-promises`.

## Uso
1. Navegar a `Backend/`.
2. Ejecutar `npm run lint` (se requiere Node >= 18 por ESLint 9).
3. Resolver los reportes antes de hacer commit para mantener calidad de código.
