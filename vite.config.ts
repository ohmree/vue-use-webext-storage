import { defineConfig } from 'vite';
import dts from 'vite-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => `vue-use-webext-storage.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'vue-demi'],
      output: {
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    target: 'esnext',
    minify: false,
  },
});
