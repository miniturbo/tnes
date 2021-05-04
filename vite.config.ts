import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '/@': path.resolve(__dirname, 'src'),
    },
  },
})
