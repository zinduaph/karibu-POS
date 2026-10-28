import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuth } from '../context/useAuth'

function SignUp() {
  const { register, user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    restaurantName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [restaurantCode, setRestaurantCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <AuthLayout title="Create your admin account">Checking your session…</AuthLayout>
  if (user && !restaurantCode) return <Navigate replace to="/dashboard/home" />

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        restaurantName: form.restaurantName,
        password: form.password,
      })
      setRestaurantCode(result.restaurant?.code || '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      subtitle="Set up your restaurant and administrator access."
      title="Create your admin account"
    >
      {restaurantCode ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            <p className="font-semibold">Your restaurant is ready.</p>
            <p className="mt-2">Restaurant code: <strong>{restaurantCode}</strong></p>
            <p className="mt-1 text-emerald-800">Keep this code for setting up cashier access.</p>
          </div>
          <button
            className="w-full rounded-xl bg-[#547A95] px-4 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => navigate('/dashboard/home', { replace: true })}
            type="button"
          >
            Continue to dashboard
          </button>
        </div>
      ) : (
        <>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[#2C3947]">
              Your name
              <input
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={100}
                name="name"
                onChange={updateField}
                required
                value={form.name}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Restaurant name
              <input
                autoComplete="organization"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={120}
                name="restaurantName"
                onChange={updateField}
                required
                value={form.restaurantName}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Email address
              <input
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={254}
                name="email"
                onChange={updateField}
                required
                type="email"
                value={form.email}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Password
              <input
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={200}
                minLength={12}
                name="password"
                onChange={updateField}
                required
                type="password"
                value={form.password}
              />
              <span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span>
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Confirm password
              <input
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={200}
                minLength={12}
                name="confirmPassword"
                onChange={updateField}
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button
              className="w-full rounded-xl bg-[#547A95] px-4 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Creating account…' : 'Create admin account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link className="font-semibold text-[#547A95] hover:underline" to="/login">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default SignUp
