import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Enable tree shaking
    rollupOptions: {
      output: {
        // Manual chunks for better caching and smaller initial bundle
        manualChunks: (id) => {
          // Only split major node_modules 
          if (id.includes('node_modules')) {
            // Ant Design - largest library
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'antd';
            }
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
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
    ]
  },
  
  // CSS processing
  css: {
    devSourcemap: true
  }
})
