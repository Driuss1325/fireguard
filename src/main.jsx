import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { SnackbarProvider } from 'notistack'
import { AppThemeProvider } from './theme/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppThemeProvider>
      <SnackbarProvider maxSnack={4} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SnackbarProvider>
    </AppThemeProvider>
  </React.StrictMode>,
)
