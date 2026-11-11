import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clientAppUrl } from '../config'
import { adminRegister } from '../services/authApi'
import qickSaleLogo from '../assets/qick-sale-stacked.svg'

const initialForm = {
  name: '',
  email: '',
  password: '',
  restaurantName: '',
}

const AdminRegistrationPage = () => {
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
      await adminRegister(form)
      window.location.replace(`${clientAppUrl}/admin/dashboard`)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create admin account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-lg rounded-3xl border border-[#547A95]/15 bg-white p-6 shadow-xl sm:p-8">
        <img alt="Qick Sale" className="h-24 w-24" src={qickSaleLogo} />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#547A95]">
          Restaurant setup
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create admin account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Register your restaurant and administrator. You will be signed in and taken to the admin setup after registration.
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
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={100}
              name="name"
              onChange={handleChange}
              required
              value={form.name}
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              autoComplete="email"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={254}
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              autoComplete="new-password"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={200}
              minLength={12}
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Use at least 12 characters.
            </span>
          </label>
          <label className="block text-sm font-semibold">
            Restaurant name
            <input
              autoComplete="organization"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#547A95]/20 px-3 py-2 text-sm outline-none focus:border-[#547A95]"
              maxLength={120}
              name="restaurantName"
              onChange={handleChange}
              required
              value={form.restaurantName}
            />
          </label>
          <button
            className="min-h-12 w-full rounded-xl bg-[#547A95] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#42677e] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating account…' : 'Create account and continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link className="font-semibold text-[#547A95] hover:underline" to="/loginAdmin">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AdminRegistrationPage
