import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable source maps in production for smaller bundle
    sourcemap: mode === 'development',
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-toast', '@radix-ui/react-slider', '@radix-ui/react-progress'],
        },
      },
    },
    // Bundle size limit warning
    chunkSizeWarningLimit: 500,
    // Enable tree shaking
    minify: 'esbuild',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  // Enable tree shaking for lucide-react
  optimizeDeps: {
    include: ['react-webcam', 'zustand'],
  },
}));
