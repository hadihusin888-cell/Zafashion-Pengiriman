/// <reference types="vite/client" />

// Fix: Augment NodeJS.ProcessEnv to include API_KEY.
// We do not declare 'process' here because it is already declared (likely by @types/node),
// causing a redeclaration error.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
