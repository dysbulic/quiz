import json5Plugin from 'vite-plugin-json5'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [json5Plugin(), react()],
})
