import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      // Báo cho Svelte 5 biết cách xử lý code Svelte 4
      compilerOptions: {
        compatibility: {
          componentApi: 4
        },
        // === DÒNG NÀY LÀ QUAN TRỌNG NHẤT ===
        runes: false 
      }
    })
  ],
});