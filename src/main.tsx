import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ChatPage from './chat/ChatPage'
import '@ethandenny/win95-ui/styles.css'
import './index.css'

createRoot(document.getElementById('root')!).render(<StrictMode><ChatPage /></StrictMode>)
