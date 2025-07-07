import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to handle eval warnings from trusted libraries
const suppressEvalWarnings = () => {
  return {
    name: 'suppress-eval-warnings',
    configResolved(_config: any) {
      // Override the console.warn to filter out eval warnings from three-stdlib
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            message.includes('Use of eval') && 
            message.includes('three-stdlib')) {
          // Suppress eval warnings from three-stdlib
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    suppressEvalWarnings()
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Increase chunk size warning limit to reduce warnings
    chunkSizeWarningLimit: 2000,
    
    // Enable tree shaking
    rollupOptions: {
      output: {
        // Manual chunks for better caching and smaller initial bundle
        manualChunks: (id) => {
          // Only split major node_modules 
          if (id.includes('node_modules')) {
            // Bundle React and Ant Design together to ensure React is available for Ant Design
            if (id.includes('react') || id.includes('react-dom') || id.includes('antd') || id.includes('@ant-design')) {
              return 'react-antd';
            }
            // Three.js and related libraries (reagraph, three-stdlib)
            if (id.includes('three') || id.includes('reagraph') || id.includes('glodrei')) {
              return 'three';
            }
            // All other vendor libraries
            return 'vendor';
          }
        },
        
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId) {
            // Generate meaningful names for route-based chunks
            if (facadeModuleId.includes('src/views/')) {
              const routeName = facadeModuleId
                .split('src/views/')[1]
                .split('/')[0]
                .toLowerCase();
              return `views/${routeName}-[hash].js`;
            }
            if (facadeModuleId.includes('src/components/')) {
              return `components/[name]-[hash].js`;
            }
          }
          return `chunks/[name]-[hash].js`;
        },
        
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      },
      
      // External dependencies (if you want to load some from CDN)
      external: [],
      
      // Tree shaking configuration - less aggressive to avoid empty chunks
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: true,
        tryCatchDeoptimization: true
      }
    },
    
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Minification settings
    minify: 'esbuild',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline smaller assets
  },
  
  // Development optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'axios',
      'date-fns',
      'styled-components'
    ],
    // Exclude problematic dependencies from optimization
    exclude: ['three-stdlib']
  },
  
  // CSS processing
  css: {
    devSourcemap: true
  },
  
  // Security settings to handle eval warnings
  define: {
    // Suppress eval warnings for known safe libraries
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  }
})
