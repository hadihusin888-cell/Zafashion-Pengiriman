interface ImportMetaEnv {
  // Add other env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}