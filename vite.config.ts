import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TS errors if process types are not fully loaded
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Polyfill process.env so your existing code works without changes
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})