import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cashierRegister, getStoredToken } from '../services/authApi'

const initialForm = {
  name: '',
  username: '',
  pin: '',
}

const CashierRegistrationPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!getStoredToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await cashierRegister(form)
      navigate('/onboarding', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Unable to create cashier account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF1D0] px-4 py-10 text-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#22396F]">Admin workspace</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Create cashier account</h1>
          <p className="mt-2 text-sm text-black/65">
            Add a cashier to this restaurant and set a secure PIN for the first login.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Wanjiku"
              required
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#22396F]"
            />
          </label>

          <label className="block text-sm font-semibold">
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="cashier1"
              required
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#22396F]"
            />
          </label>

          <label className="block text-sm font-semibold">
            PIN
            <input
              type="password"
              name="pin"
              value={form.pin}
              onChange={handleChange}
              placeholder="123456"
              required
              minLength={4}
              maxLength={20}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#22396F]"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creating cashier…' : 'Create cashier'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-black/60">
          <Link to="/dashboard/home" className="font-semibold text-[#22396F] hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CashierRegistrationPage
