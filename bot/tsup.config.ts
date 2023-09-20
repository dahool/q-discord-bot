import { defineConfig } from "tsup";

export default defineConfig((options)=>({
    entry: [
      "src/main.ts"
    ],
    outDir: '../dist',
    format: ['cjs'],
    target: 'es2020',
    minify: false
  }));