import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store'
import App from './App'
import './index.css'
import { AppProvider } from './context/AppContext.tsx';
import { AttributionProvider } from './context/AttributionContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppProvider>
          <AttributionProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AttributionProvider>
        </AppProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
