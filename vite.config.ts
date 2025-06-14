import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TextToSVG',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['opentype.js', 'fs', 'path'],
      output: {
        globals: {
          'opentype.js': 'opentype',
        },
      },
    },
    outDir: 'build',
  },
  test: {
    environment: 'node',
    globals: true,
  },
})