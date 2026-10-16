import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cashierLogin } from '../services/authApi'

const CashierLoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    restaurantCode: '',
    username: '',
    pin: '',
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
      const response = await cashierLogin(form)
      navigate(response.user?.mustChangePin ? '/change-pin' : '/dashboard/home', {
        replace: true,
      })
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
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Cashier sign in</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Enter your restaurant code, username, and PIN to open the POS.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in to POS'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Admin?{' '}
          <a
            className="font-semibold text-[#22396F] hover:underline"
            href={`${import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174'}/login`}
          >
            Sign in to administration
          </a>
        </p>
      </section>
    </main>
  )
}

export default CashierLoginPage
