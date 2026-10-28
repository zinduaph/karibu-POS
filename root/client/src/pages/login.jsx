import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Login() {
  const { login, loading, sessionError, user } = useAuth()
  const location = useLocation()
  const [restaurantCode, setRestaurantCode] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <AuthMessage>Checking your session…</AuthMessage>
  }

  if (user?.role === 'cashier') {
    return <Navigate replace to={user.mustChangePin ? '/change-pin' : '/dashboard'} />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({
        restaurantCode: restaurantCode.trim().toUpperCase(),
        username: username.trim().toLowerCase(),
        pin,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
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
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547A95]">Cashier access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#22396F]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in with the account details provided by your restaurant administrator.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-[#2C3947]">
          Restaurant code
          <input
            autoComplete="organization"
            className={inputClass}
            maxLength={20}
            onChange={(event) => setRestaurantCode(event.target.value)}
            required
            value={restaurantCode}
          />
        </label>
        <label className="block text-sm font-medium text-[#2C3947]">
          Username
          <input
            autoComplete="username"
            className={inputClass}
            maxLength={40}
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </label>
        <label className="block text-sm font-medium text-[#2C3947]">
          PIN
          <input
            autoComplete="current-password"
            className={inputClass}
            maxLength={20}
            onChange={(event) => setPin(event.target.value)}
            required
            type="password"
            value={pin}
          />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button
          className="w-full rounded-xl bg-[#22396F] px-4 py-3 font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm leading-6 text-slate-600">
        Need an account? Cashier accounts are created by your restaurant administrator.
      </p>
      <Link className="mt-5 block text-center text-sm font-semibold text-[#547A95] hover:underline" to="/">
        Back to home
      </Link>
    </AuthLayout>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20'

function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-md rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm sm:p-8">
        <Link className="mb-8 flex items-center gap-3" to="/" aria-label="Karibu POS home">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#22396F] text-lg font-bold text-[#FCF1D0]">K</span>
          <span>
            <span className="block font-bold tracking-tight text-[#22396F]">Karibu POS</span>
            <span className="block text-xs font-medium text-[#547A95]">Cashier</span>
          </span>
        </Link>
        {children}
      </section>
    </main>
  )
}

function AuthMessage({ children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F6F8] px-4 text-sm text-slate-600">
      {children}
    </main>
  )
}

export default Login
