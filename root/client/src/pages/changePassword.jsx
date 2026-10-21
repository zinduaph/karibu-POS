import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeAdminPassword } from '../services/authApi'

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.newPassword !== form.confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    if (form.newPassword.length < 12) {
      setError('Your new password must be at least 12 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await changeAdminPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      navigate('/onboarding', { replace: true })
    } catch (changeError) {
      setError(changeError.message || 'Unable to change your password. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 py-10 text-black">
      <section className="w-full max-w-md rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22396F]">First sign in</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Set a strong password before accessing the administration panel.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {[
            ['currentPassword', 'Current password', 'current-password'],
            ['newPassword', 'New password', 'new-password'],
            ['confirmPassword', 'Confirm new password', 'new-password'],
          ].map(([name, label, autocomplete]) => (
            <label className="block text-sm font-semibold" key={name}>
              {label}
              <input
                autoComplete={autocomplete}
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                maxLength={200}
                minLength={name === 'currentPassword' ? 1 : 12}
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
            {isSubmitting ? 'Updating password…' : 'Change password'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ChangePasswordPage
