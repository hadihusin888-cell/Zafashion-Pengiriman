// /// <reference types="vite/client" />

// Declare process to prevent errors in services using process.env, 
// and comment out vite/client reference if the types are missing in the environment.
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};
