import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeCashierPin } from '../services/authApi'

const CashierPinChangePage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPin: '', newPin: '', confirmPin: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.newPin !== form.confirmPin) {
      setError('The new PINs do not match.')
      return
    }
    if (form.newPin.length < 4) {
      setError('Your new PIN must be at least 4 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await changeCashierPin({
        currentPin: form.currentPin,
        newPin: form.newPin,
      })
      navigate('/dashboard/home', { replace: true })
    } catch (changeError) {
      setError(changeError.message || 'Unable to change your PIN. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 py-10 text-black">
      <section className="w-full max-w-md rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22396F]">First sign in</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Choose a new PIN</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Your administrator gave you a temporary PIN. Change it before using the POS.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {[
            ['currentPin', 'Temporary PIN', 'current-password'],
            ['newPin', 'New PIN', 'new-password'],
            ['confirmPin', 'Confirm new PIN', 'new-password'],
          ].map(([name, label, autocomplete]) => (
            <label className="block text-sm font-semibold" key={name}>
              {label}
              <input
                autoComplete={autocomplete}
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                inputMode="numeric"
                maxLength={20}
                minLength={name === 'currentPin' ? 1 : 4}
                name={name}
                onChange={handleChange}
                required
                type="password"
                value={form[name]}
              />
            </label>
          ))}

          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Updating PIN…' : 'Change PIN'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default CashierPinChangePage
