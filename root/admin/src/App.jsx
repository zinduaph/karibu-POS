import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/dashboard'
import DashboardHome from './pages/dashboardHome'
import LoginPage from './pages/login'
import SignUp from './components/signUp'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import Ingredients from './pages/ingredients'
import MenuItems from './pages/menuitems'
import Orders from './pages/orders'
import Reports from './pages/reports'
import Sales from './pages/sales'
import Settings from './pages/settings'
import Staff from './pages/staff'
import './App.css'

function RequireAuth({ children }) {
  const { loading, user } = useAuth()

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-600">Checking your session…</div>
  }
  return user ? children : <Navigate replace to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignUp />} path="/signup" />
          <Route
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
            path="/dashboard"
          >
            <Route element={<Navigate replace to="home" />} index />
            <Route element={<DashboardHome />} path="home" />
            <Route element={<MenuItems />} path="menu-items" />
            <Route element={<Sales />} path="sales" />
            <Route element={<Orders />} path="orders" />
            <Route element={<Ingredients />} path="ingredients" />
            <Route element={<Staff />} path="staff" />
            <Route element={<Reports />} path="reports" />
            <Route element={<Settings />} path="settings" />
          </Route>
          <Route element={<Navigate replace to="/dashboard/home" />} path="*" />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
