import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/dashboard'
import DashboardHome from './pages/dashboardHome'
import Home from './pages/Home'
import Orders from './pages/orders'
import Sale from './pages/sale'
import Login from './pages/login'
import ChangePin from './pages/changePin'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-pin" element={<ChangePin />} />
        <Route path="/dashboard" element={<CashierRoute><Dashboard /></CashierRoute>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="sale" element={<Sale />} />
          <Route path="orders" element={<Orders />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function CashierRoute({ children }) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Checking your session…</main>
  }
  if (!user || user.role !== 'cashier') {
    return <Navigate replace to="/login" state={{ from: location }} />
  }
  if (user.mustChangePin) return <Navigate replace to="/change-pin" />
  return children
}

export default App
