import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminRegister } from '../services/authApi'
import qickSaleLogo from '../assets/qick-sale-stacked.svg'

const initialForm = {
  name: '',
  email: '',
  password: '',
  restaurantName: '',
}

const AdminRegistrationPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
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
      await adminRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        restaurantName: form.restaurantName,
      })
      navigate('/admin/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Unable to create admin account. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 py-10 text-black">
      <section className="w-full max-w-md rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <Link aria-label="Qick Sale home" to="/" className="inline-flex">
          <img alt="Qick Sale" className="h-20 w-20" src={qickSaleLogo} />
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Create admin account</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Set up your restaurant and administrator account.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Full name
            <input
              autoComplete="name"
              className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
              maxLength={100}
              name="name"
              onChange={handleChange}
              placeholder="Jane Wanjiku"
              required
              value={form.name}
            />
          </label>

          <label className="block text-sm font-semibold">
            Email
            <input
              autoComplete="email"
              className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
              maxLength={254}
              name="email"
              onChange={handleChange}
              placeholder="you@restaurant.com"
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              autoComplete="new-password"
              className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
              maxLength={200}
              minLength={12}
              name="password"
              onChange={handleChange}
              placeholder="••••••••••••"
              required
              type="password"
              value={form.password}
            />
          </label>

          <label className="block text-sm font-semibold">
            Restaurant name
            <input
              autoComplete="organization"
              className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
              maxLength={120}
              name="restaurantName"
              onChange={handleChange}
              placeholder="Karibu Cafe"
              required
              value={form.restaurantName}
            />
          </label>

          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Already have an account?{' '}
          <Link
            className="font-semibold text-[#22396F] hover:underline"
            to="/admin/login"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AdminRegistrationPage
