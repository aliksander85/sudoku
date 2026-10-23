/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://aliksander85.github.io/sudoku/ on GitHub Pages
  base: '/sudoku/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
