/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE?: string;
  }
}

// Asegura que los elementos intrínsecos estén disponibles (debería venir de @types/react)
// Este archivo sirve como lugar para ampliar tipos globales si se necesita.
