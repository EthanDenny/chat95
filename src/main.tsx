import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DesignPage from './DesignPage.tsx'
import './cursors.css'

const path = window.location.pathname.replace(/\/$/, '')
const Page = path === '/test/desktop' ? App : path === '/test/design' ? DesignPage : null
document.title = path === '/test/desktop' ? 'Windows 95 Desktop' : path === '/test/design' ? 'Windows 95 · Design' : 'Chat95'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Page && <Page />}
  </StrictMode>,
)
