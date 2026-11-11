import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './components/login'
import Monitoring from './components/moniter'

function isLoggedIn() {
  return Boolean(window.localStorage.getItem('dev_token'))
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={isLoggedIn() ? <Navigate to="/monitoring" replace /> : <Login />} />
        <Route path="/monitoring" element={isLoggedIn() ? <Monitoring /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={isLoggedIn() ? '/monitoring' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
