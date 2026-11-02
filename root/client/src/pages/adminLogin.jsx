import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../services/authApi'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
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
      const response = await adminLogin({ email: form.email, password: form.password })
      
      // Redirect based on mustChangePassword flag
      if (response.user?.mustChangePassword) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
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
        <Link to="/" className="text-sm font-semibold text-[#22396F] hover:underline">
          Karibu POS
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Enter your email and password to access the administration panel.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              value={form.password}
              type="password"
            />
          </label>

          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in to Administration'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Cashier?{' '}
          <Link
            className="font-semibold text-[#22396F] hover:underline"
            to="/login"
          >
            Sign in to POS
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AdminLoginPage