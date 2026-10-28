import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getCashiers, registerCashier } from '../services/authApi'

function Staff() {
  const { accessToken } = useAuth()
  const [cashiers, setCashiers] = useState([])
  const [form, setForm] = useState({ name: '', username: '', pin: '' })
  const [createdCashier, setCreatedCashier] = useState(null)
  const [error, setError] = useState('')
  const [cashierListError, setCashierListError] = useState('')
  const [loadingCashiers, setLoadingCashiers] = useState(true)
  const [cashierListVersion, setCashierListVersion] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCashiers() {
      setLoadingCashiers(true)
      setCashierListError('')
      try {
        const result = await getCashiers(accessToken)
        if (active) setCashiers(result)
      } catch (requestError) {
        if (active) setCashierListError(requestError.message)
      } finally {
        if (active) setLoadingCashiers(false)
      }
    }

    loadCashiers()
    return () => {
      active = false
    }
  }, [accessToken, cashierListVersion])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setCreatedCashier(null)
    setSubmitting(true)

    try {
      const result = await registerCashier(accessToken, form)
      if (!result?.user || !result?.restaurantCode) {
        throw new Error('The authentication API returned an unexpected cashier account response.')
      }
      setCreatedCashier({
        name: result.user.name,
        username: result.user.username,
        restaurantCode: result.restaurantCode,
        initialPin: form.pin,
      })
      setForm({ name: '', username: '', pin: '' })
      setCashierListVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Staff</h1>
        <p className="mt-2 text-sm text-slate-500">Create cashier accounts for your restaurant.</p>
      </header>

      <section className="max-w-2xl rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-[#2C3947]">Create a cashier account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a username and a temporary six-digit PIN. The cashier will need to change the PIN after signing in.
        </p>

        {createdCashier && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            <p className="font-semibold">Cashier account created for {createdCashier.name}.</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div><dt className="font-semibold">Restaurant code</dt><dd>{createdCashier.restaurantCode}</dd></div>
              <div><dt className="font-semibold">Username</dt><dd>{createdCashier.username}</dd></div>
              <div><dt className="font-semibold">Temporary PIN</dt><dd>{createdCashier.initialPin}</dd></div>
            </dl>
            <p className="mt-3">Share these sign-in details with the cashier securely. They must change the PIN after their first login.</p>
            <button
              className="mt-3 font-semibold underline"
              onClick={() => setCreatedCashier(null)}
              type="button"
            >
              Hide sign-in details
            </button>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#2C3947]">
            Cashier name
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
            Username
            <input
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              maxLength={40}
              name="username"
              onChange={updateField}
              required
              value={form.username}
            />
          </label>
          <label className="block text-sm font-medium text-[#2C3947]">
            Temporary PIN
            <input
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              name="pin"
              onChange={updateField}
              pattern="[0-9]{6}"
              required
              type="password"
              value={form.pin}
            />
            <span className="mt-1 block text-xs text-slate-500">Use six digits; common or sequential PINs are not allowed.</span>
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            className="rounded-xl bg-[#547A95] px-5 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Creating account…' : 'Create cashier account'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        <div className="border-b border-[#547A95]/15 px-6 py-5">
          <h2 className="text-lg font-semibold text-[#2C3947]">Cashiers</h2>
          <p className="mt-1 text-sm text-slate-500">Cashier accounts belonging to your restaurant.</p>
        </div>
        {cashierListError ? (
          <div className="p-6">
            <p className="text-sm text-red-700" role="alert">{cashierListError}</p>
            <button
              className="mt-3 text-sm font-semibold text-[#547A95] hover:underline"
              onClick={() => setCashierListVersion((version) => version + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : loadingCashiers ? (
          <p className="p-6 text-sm text-slate-500" role="status">Loading cashiers…</p>
        ) : cashiers.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No cashier accounts have been created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[#547A95]/15 bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Username</th>
                  <th className="px-5 py-4 font-semibold">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#547A95]/10">
                {cashiers.map((cashier) => (
                  <tr key={cashier._id}>
                    <td className="px-5 py-4 font-medium text-[#2C3947]">{cashier.name}</td>
                    <td className="px-5 py-4 text-slate-600">{cashier.username}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {cashier.lastLoginAt
                        ? new Date(cashier.lastLoginAt).toLocaleString()
                        : 'Never signed in'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Staff
