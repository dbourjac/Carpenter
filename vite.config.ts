import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Cargar variables .env para que podamos usar VITE_API_URL aquí
  const env = loadEnv(mode, process.cwd(), '');
  // Para el proxy de desarrollo usa VITE_BACKEND_URL si está definida,
  // si no, usa VITE_API_URL (por compatibilidad) y finalmente fallback a localhost:3000
  const apiUrl = env.VITE_BACKEND_URL || env.VITE_API_URL || 'http://localhost:3000';

  return {
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Proxy de desarrollo: redirige llamadas a /api hacia el backend
  server: {
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
}
})
