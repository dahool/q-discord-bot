import { createRoot } from 'react-dom/client'
import { Routes } from '@generouted/react-router'
import StoreProvider from './StoreProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StoreProvider>
    <Routes />
  </StoreProvider>
)