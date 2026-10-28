import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'

function LoginPage() {
  const { login, user, loading, sessionError } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <AuthLayout title="Sign in to Karibu POS">Checking your session…</AuthLayout>
  if (user) return <Navigate replace to="/dashboard/home" />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      subtitle="Sign in to manage your restaurant."
      title="Welcome back"
    >
      {location.state?.notice && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">
          {location.state.notice}
        </p>
      )}
      {sessionError && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">
          Could not restore your previous session: {sessionError}
        </p>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-[#2C3947]">
          Email address
          <input
            autoComplete="username"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-medium text-[#2C3947]">
          Password
          <input
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
            maxLength={200}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button
          className="w-full rounded-xl bg-[#547A95] px-4 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to Karibu POS? <Link className="font-semibold text-[#547A95] hover:underline" to="/signup">Create an admin account</Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
