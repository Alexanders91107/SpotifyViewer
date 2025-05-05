// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // keeps your base path config
  build: {
    target: 'es2022' // enables top-level await support
  }
});
