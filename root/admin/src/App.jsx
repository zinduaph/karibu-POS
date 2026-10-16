import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Dashboard />} path="/dashboard">
          <Route element={<Navigate replace to="home" />} index />
          <Route element={<DashboardHome />} path="home" />
          <Route element={<ProductsPage />} path="products" />
          <Route element={<SalesPage />} path="sales" />
          <Route element={<OrdersPage />} path="orders" />
          <Route element={<StaffPage />} path="staff" />
          <Route element={<ReportsPage />} path="reports" />
          <Route element={<SettingsPage />} path="settings" />
        </Route>
        <Route element={<Navigate replace to="/dashboard/home" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
