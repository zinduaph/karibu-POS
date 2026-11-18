import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DashboardHome from './pages/dashboardHome'
import Dashboard from './pages/dashboard'
import Sale from './pages/sale'
import Orders from './pages/orders'
import AdminDashboard from './pages/adminDashboard'
import AdminLoginPage from './pages/adminLogin'
import AdminRegistrationPage from './pages/adminreg'
import CashierRegistrationPage from './pages/cashierreg'
import CashierLoginPage from './pages/login'
import CashierPinChangePage from './pages/changePin'
import ChangePasswordPage from './pages/changePassword'
import OnboardingPage from './pages/onboarding'
import HowItWorks from './pages/howItWorks'
import { Toaster } from 'react-hot-toast'

// Role protection is now handled by the backend (auth middleware).
// These helper functions check localStorage for UX guidance only.

function getUser() {
  let user = null
  try {
    user = JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    window.localStorage.removeItem('user')
  }
  return user
}

function checkRole(role) {
  const user = getUser()
  return user && user.role === role
}

function isAuthenticated() {
  return !!getUser()
}

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/how-it-works' element={<HowItWorks />} />
        <Route path='/login' element={<CashierLoginPage />} />
        <Route path='/admin/login' element={<AdminLoginPage />} />
        <Route path='/admin/register' element={<AdminRegistrationPage />} />
        <Route path='/cashier/register' element={<CashierRegistrationPage />} />
        <Route path='/change-pin' element={checkRole('cashier') ? <CashierPinChangePage /> : <Navigate to="/login" replace />} />
        <Route path='/change-password' element={checkRole('admin') ? <ChangePasswordPage /> : <Navigate to="/admin/login" replace />} />
        <Route path='/onboarding' element={isAuthenticated() ? <OnboardingPage /> : <Navigate to="/login" replace />} />
        <Route
          path='/admin'
          element={checkRole('admin') ? <AdminDashboard /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path='/admin/dashboard'
          element={checkRole('admin') ? <AdminDashboard /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path='/dashboard'
          element={checkRole('cashier') ? <Dashboard /> : <Navigate to="/login" replace />}
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
