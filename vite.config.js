// import vue from '@vitejs/plugin-vue';
// import tailwindcss from '@tailwindcss/vite';
// import { defineConfig } from 'vite';

// export default {
//     plugins: [vue(), tailwindcss()],
// }

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org', // Servidor real
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''), // Quita el prefijo del proxy
        headers: {
          'User-Agent': 'ViaSeguraApp/1.0 (Proyecto escolar - Escuela Da Vinci)',
          'Accept-Language': 'es',
        },
      },
    },
  },
})
