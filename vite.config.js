
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      // Polyfill process.env.API_KEY for the @google/genai SDK
      // Ensure it's a string even if the env var is missing
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    }
  }
})
