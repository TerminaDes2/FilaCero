/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE?: string;
  }
}

// Asegura que los elementos intrínsecos estén disponibles (debería venir de @types/react)
// Este archivo sirve como lugar para ampliar tipos globales si se necesita.

// Shim mínimo para `next/navigation` en caso de que el entorno de tipos no lo resuelva.
// Esto evita errores de "No se encuentra el módulo 'next/navigation'" en editores
// o durante chequeos de tipo cuando las declaraciones de Next no están disponibles.

