import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../services/authApi'
import { clientAppUrl } from '../config'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
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
      await adminLogin(form)
      navigate('/dashboard/home', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Check your credentials and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-md rounded-3xl border border-[#547A95]/15 bg-white p-6 shadow-xl sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#547A95] text-xl font-bold text-white">
          K
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#547A95]">
          Karibu POS · Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in with the email and password you used to register this restaurant.
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
              autoComplete="username"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={254}
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={200}
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </label>
          <button
            className="min-h-12 w-full rounded-xl bg-[#547A95] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#42677e] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need an account?{' '}
          <a className="font-semibold text-[#547A95] hover:underline" href="/register">
            Register your restaurant
          </a>
        </p>
        <p className="mt-3 text-center text-sm text-slate-500">
          Cashier?{' '}
          <a className="font-semibold text-[#547A95] hover:underline" href={`${clientAppUrl}/login`}>
            Use the cashier POS
          </a>
        </p>
      </section>
    </main>
  )
}

export default AdminLoginPage
