import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Tornar variável de ambiente acessível no bundle
    "process.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL ?? ""),
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    // Output como IIFE — um único ficheiro bundle.js que pode ser carregado com <script>
    lib: {
      entry: "src/main.tsx",
      name: "ClinicaBotWidget",
      formats: ["iife"],
      fileName: () => "bundle.js",
    },
    rollupOptions: {
      // React e ReactDOM incluídos no bundle (sem dependências externas)
      external: [],
      output: {
        // Garante que não há código-splitting — tudo num ficheiro
        inlineDynamicImports: true,
      },
    },
    // Targets modernos para bundle menor
    target: "es2017",
    minify: "esbuild",
  },
});
