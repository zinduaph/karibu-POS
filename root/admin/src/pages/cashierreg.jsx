import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cashierRegister, getStoredRestaurant } from '../services/authApi'

const initialForm = { name: '', username: '', pin: '' }

const CashierRegistrationPage = () => {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [createdUsername, setCreatedUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const restaurant = getStoredRestaurant()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await cashierRegister(form)
      setCreatedUsername(response.username)
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create cashier account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">
          Register cashier
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a cashier account for {restaurant?.name || 'your restaurant'}.
        </p>
      </header>

      {createdUsername && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Cashier account created.</p>
          <p className="mt-1">
            Give <strong>{createdUsername}</strong> the PIN and restaurant code
            <strong> {restaurant?.code || 'shown at restaurant registration'}</strong>.
            They can use this PIN to sign in.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <form
        className="space-y-4 rounded-2xl border border-[#547A95]/15 bg-white p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit}
      >
        <label className="block text-sm font-semibold">
          Cashier full name
          <input
            autoComplete="name"
            className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
            maxLength={100}
            name="name"
            onChange={handleChange}
            required
            value={form.name}
          />
        </label>
        <label className="block text-sm font-semibold">
          Username
          <input
            autoComplete="off"
            className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
            maxLength={40}
            name="username"
            onChange={handleChange}
            required
            value={form.username}
          />
        </label>
        <label className="block text-sm font-semibold">
          Cashier PIN
          <input
            autoComplete="new-password"
            className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
            inputMode="numeric"
            maxLength={20}
            minLength={4}
            name="pin"
            onChange={handleChange}
            required
            type="password"
            value={form.pin}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Avoid common PINs and share the PIN securely with the cashier.
          </span>
        </label>
        <button
          className="min-h-12 w-full rounded-xl bg-[#547A95] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#42677e] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating cashier…' : 'Create cashier account'}
        </button>
      </form>

      <Link className="text-sm font-semibold text-[#547A95] hover:underline" to="/dashboard/staff">
        Back to staff
      </Link>
    </main>
  )
}

export default CashierRegistrationPage
