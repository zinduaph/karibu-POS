
import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DashboardHome from './pages/dashboardHome'
import Dashboard from './pages/dashboard'
import Sale from './pages/sale'
import Orders from './pages/orders'
import AdminRegistrationPage from './pages/adminreg'
import CashierRegistrationPage from './pages/cashierreg'
import CashierLoginPage from './pages/login'
import CashierPinChangePage from './pages/changePin'
import { getStoredToken } from './services/authApi'
import { Toaster } from 'react-hot-toast'

function RequireCashier({ children }) {
  const token = getStoredToken()
  let user = null
  try {
    user = JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    window.localStorage.removeItem('user')
  }

  if (!token || user?.role !== 'cashier') {
    return <Navigate replace to="/login" />
  }
  if (user.mustChangePin) {
    return <Navigate replace to="/change-pin" />
  }
  return children
}

function RequirePinChange({ children }) {
  const token = getStoredToken()
  let user = null
  try {
    user = JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    window.localStorage.removeItem('user')
  }

  if (!token || user?.role !== 'cashier') {
    return <Navigate replace to="/login" />
  }
  if (!user.mustChangePin) {
    return <Navigate replace to="/dashboard/home" />
  }
  return children
}

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<CashierLoginPage />} />
        <Route path='/admin/register' element={<AdminRegistrationPage />} />
        <Route path='/cashier/register' element={<CashierRegistrationPage />} />
        <Route
          path='/change-pin'
          element={
            <RequirePinChange>
              <CashierPinChangePage />
            </RequirePinChange>
          }
        />
        <Route
          path='/dashboard'
          element={
            <RequireCashier>
              <Dashboard />
            </RequireCashier>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path='home' element={<DashboardHome />} />
          <Route path='sale' element={<Sale />} />
          <Route path='orders' element={<Orders />} />
        </Route>
        <Route path='*' element={<Home />} />
      </Routes>
    </>
  )
}

export default App
