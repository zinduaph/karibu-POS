import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from './pages/loginAdmin'
import AdminRegistrationPage from './pages/adminreg'
import CashierRegistrationPage from './pages/cashierreg'
import Dashboard from './pages/dashboard'
import DashboardHome from './pages/dashboardHome'
import {
  OrdersPage,
  ProductsPage,
  ReportsPage,
  SalesPage,
  SettingsPage,
  StaffPage,
} from './pages/adminPages'
import './App.css'
import { getStoredToken, getStoredUser } from './services/authApi'

function RequireAdmin({ children }) {
  const user = getStoredUser()
  if (!getStoredToken() || user?.role !== 'admin') {
    return <Navigate replace to="/loginAdmin" />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminRegistrationPage />} path="/register" />
        <Route element={<AdminLoginPage />} path="/loginAdmin" />
        <Route
          element={
            <RequireAdmin>
              <Dashboard />
            </RequireAdmin>
          }
          path="/dashboard"
        >
          <Route element={<Navigate replace to="home" />} index />
          <Route element={<DashboardHome />} path="home" />
          <Route element={<ProductsPage />} path="products" />
          <Route element={<SalesPage />} path="sales" />
          <Route element={<OrdersPage />} path="orders" />
          <Route element={<StaffPage />} path="staff" />
          <Route element={<CashierRegistrationPage />} path="staff/new" />
          <Route element={<ReportsPage />} path="reports" />
          <Route element={<SettingsPage />} path="settings" />
        </Route>
        <Route element={<Navigate replace to="/dashboard/home" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
