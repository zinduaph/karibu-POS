import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const result = await apiRequest('/api/auth/dev/login', null, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      
      if (!result.token) throw new Error('The server did not return a login token.')
      window.localStorage.setItem('dev_token', result.token)
      toast.success('Signed in successfully')
      navigate('/monitoring', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to sign in. Check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-md rounded-3xl border border-[#547A95]/15 bg-white p-7 shadow-xl sm:p-9">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#547A95] text-white">
          <Activity size={24} />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#547A95]">
          Karibu POS · Developer
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Developer sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in to view hostel sales and service activity.
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Email
            <input
              autoComplete="username"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none transition focus:border-[#547A95] focus:ring-4 focus:ring-[#547A95]/10"
              maxLength={254}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <span className="relative mt-2 block">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                autoComplete="current-password"
                className="min-h-11 w-full rounded-xl border border-[#547A95]/20 py-2 pl-10 pr-12 text-sm outline-none transition focus:border-[#547A95] focus:ring-4 focus:ring-[#547A95]/10"
                maxLength={200}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#547A95]"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#547A95] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#42677e] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            <ShieldCheck size={18} />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-400">
          Authorized developer access only
        </p>
      </section>
    </main>
  )
}

export default Login
