import React from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { AppProvider } from './context/AppContext.tsx';
import { AttributionProvider } from './context/AttributionContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { store } from './store/store'
import App from './App'

import './index.css'
import './styles/globals.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppProvider>
            <AttributionProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </AttributionProvider>
          </AppProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
