import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cashierLogin, adminLogin } from '../services/authApi'
import qickSaleLogo from '../assets/qick-sale-stacked.svg'

const LoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: 'cashier', // or 'admin'
    restaurantCode: '',
    username: '',
    pin: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      let response
      if (form.role === 'admin') {
        response = await adminLogin({ email: form.email, password: form.password })
      } else {
        response = await cashierLogin({
          restaurantCode: form.restaurantCode,
          username: form.username,
          pin: form.pin,
        })
      }
      
      if (response.user?.mustChangePassword) {
        navigate('/change-password', { replace: true })
      } else if (form.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard/home', { replace: true })
      }
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Check your details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 py-10 text-black">
      <section className="w-full max-w-md rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <Link aria-label="Qick Sale home" to="/" className="inline-flex">
          <img alt="Qick Sale" className="h-40 w-40" src={qickSaleLogo} />
        </Link>
        
        {/* Role Toggle */}
        

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          {form.role === 'cashier' ? 'Cashier sign in' : 'Admin sign in'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          {form.role === 'cashier'
            ? 'Enter your restaurant code, username, and PIN to open the POS.'
            : 'Enter your email and password to access the administration panel.'}
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {form.role === 'cashier' && (
            <>
              <label className="block text-sm font-semibold">
                Restaurant code
                <input
                  autoComplete="organization"
                  className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                  maxLength={20}
                  name="restaurantCode"
                  onChange={handleChange}
                  placeholder="KRB-XXXXXXXX"
                  required
                  value={form.restaurantCode}
                />
              </label>

              <label className="block text-sm font-semibold">
                Username
                <input
                  autoComplete="username"
                  className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                  maxLength={40}
                  name="username"
                  onChange={handleChange}
                  required
                  value={form.username}
                />
              </label>

              <label className="block text-sm font-semibold">
                PIN
                <input
                  autoComplete="current-password"
                  className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                  inputMode="numeric"
                  maxLength={20}
                  name="pin"
                  onChange={handleChange}
                  required
                  type="password"
                  value={form.pin}
                />
              </label>
            </>
          )}

          {form.role === 'admin' && (
            <>
              <label className="block text-sm font-semibold">
                Email
                <input
                  autoComplete="email"
                  className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                  maxLength={254}
                  name="email"
                  onChange={handleChange}
                  required
                  value={form.email}
                />
              </label>

              <label className="block text-sm font-semibold">
                Password
                <input
                  autoComplete="current-password"
                  className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                  maxLength={200}
                  name="password"
                  onChange={handleChange}
                  required
                  type="password"
                  value={form.password}
                />
              </label>
            </>
          )}

          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : `${form.role === 'cashier' ? 'Sign in to POS' : 'Sign in to Administration'}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          {form.role === 'cashier' ? (
            <span>
              Admin?{' '}
              <a
                className="font-semibold text-[#22396F] hover:underline"
                href={`${import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174'}/loginAdmin`}
              >
                Sign in to administration
              </a>
            </span>
          ) : (
            <span>
              Cashier?{' '}
              <a
                className="font-semibold text-[#22396F] hover:underline"
                onClick={() => setForm((f) => ({ ...f, role: 'cashier' }))}
              >
                Sign in to POS
              </a>
            </span>
          )}
        </p>
      </section>
    </main>
  )
}

export default LoginPage
