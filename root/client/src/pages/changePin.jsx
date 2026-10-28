import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20'

function ChangePin() {
  const { changePin, loading, user } = useAuth()
  const navigate = useNavigate()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Checking your session…</main>
  }

  if (!user || user.role !== 'cashier') return <Navigate replace to="/login" />
  if (!user.mustChangePin) return <Navigate replace to="/dashboard" />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (newPin !== confirmPin) {
      setError('The new PINs do not match.')
      return
    }
    if (newPin === currentPin) {
      setError('Choose a new PIN that is different from your current PIN.')
      return
    }

    setSubmitting(true)
    try {
      await changePin({ currentPin, newPin })
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-md rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#22396F] text-lg font-bold text-[#FCF1D0]">K</span>
          <div>
            <p className="font-bold tracking-tight text-[#22396F]">Karibu POS</p>
            <p className="text-xs font-medium text-[#547A95]">Cashier account security</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set your personal PIN</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your administrator provided a temporary PIN. Change it before continuing.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Current PIN
            <input
              autoComplete="current-password"
              className={inputClass}
              maxLength={20}
              onChange={(event) => setCurrentPin(event.target.value)}
              required
              type="password"
              value={currentPin}
            />
          </label>
          <label className="block text-sm font-medium">
            New PIN
            <input
              autoComplete="new-password"
              className={inputClass}
              maxLength={20}
              onChange={(event) => setNewPin(event.target.value)}
              required
              type="password"
              value={newPin}
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm new PIN
            <input
              autoComplete="new-password"
              className={inputClass}
              maxLength={20}
              onChange={(event) => setConfirmPin(event.target.value)}
              required
              type="password"
              value={confirmPin}
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            className="w-full rounded-xl bg-[#22396F] px-4 py-3 font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Updating PIN…' : 'Update PIN'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ChangePin
