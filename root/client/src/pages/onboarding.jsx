import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getOnboardingStatus,
  updateRestaurantDetails,
  addProduct,
  listProducts,
  markOnboardingComplete,
} from '../services/authApi'

const adminAppUrl = (
  import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174'
).replace(/\/+$/, '')

const STEP_LABELS = {
  password: 'Set password',
  restaurant: 'Restaurant details',
  inventory: 'Add products',
  cashiers: 'Create cashier',
  complete: 'Complete',
  welcome: 'Welcome',
}

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Restaurant details form
  const [restaurantForm, setRestaurantForm] = useState({ name: '', location: '', contactInfo: '', logo: '' })
  // Product form
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'food', stockQuantity: '' })
  const [products, setProducts] = useState([])
  // Cashier form
  const [cashierForm, setCashierForm] = useState({ name: '', username: '', pin: '' })

  const loadProducts = async () => {
    try {
      const data = await listProducts()
      setProducts(data.products || [])
    } catch (err) {
      setError(err.message || 'Unable to load products')
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOnboardingStatus()
        setStatus(data)
        if (data.role === 'admin' && data.onboardingStep === 'inventory') {
          await loadProducts()
        }
      } catch (err) {
        setError(err.message || 'Unable to load onboarding status')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const nextStep = () => {
    if (!status) return
    const order = ['password', 'restaurant', 'inventory', 'cashiers', 'complete']
    const currentIndex = order.indexOf(status.onboardingStep)
    if (currentIndex === -1) return
    setStatus({ ...status, onboardingStep: order[currentIndex + 1] || 'complete' })
  }

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateRestaurantDetails({
        name: restaurantForm.name || undefined,
        location: restaurantForm.location || undefined,
        contactInfo: restaurantForm.contactInfo || undefined,
        logo: restaurantForm.logo || undefined,
      })
      nextStep()
    } catch (err) {
      setError(err.message || 'Unable to update restaurant details')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await addProduct({
        name: productForm.name,
        price: Number(productForm.price),
        category: productForm.category,
        stockQuantity: Number(productForm.stockQuantity),
      })
      await loadProducts()
      setProductForm({ name: '', price: '', category: 'food', stockQuantity: '' })
    } catch (err) {
      setError(err.message || 'Unable to add product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCashierSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/cashier/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cashierForm),
      })
      nextStep()
    } catch (err) {
      setError(err.message || 'Unable to create cashier account')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    setError('')
    setSubmitting(true)
    try {
      await markOnboardingComplete()
      window.location.replace(`${adminAppUrl}/dashboard/home`)
    } catch (err) {
      setError(err.message || 'Unable to complete onboarding')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    if (!status) return null
    const role = status.role
    const step = status.onboardingStep || (role === 'admin' ? 'restaurant' : 'complete')

    if (role === 'cashier') {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#22396F] mb-2">Welcome to Karibu POS</h2>
          <p className="text-black/60 mb-6">
            Your PIN has been set. You are ready to start using the point of sale.
          </p>
          <button
            onClick={() => markOnboardingComplete().then(() => navigate('/dashboard/home', { replace: true }))}
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Finishing…' : 'Start using POS'}
          </button>
        </div>
      )
    }

    // Admin steps
    if (step === 'restaurant') {
      return (
        <form onSubmit={handleRestaurantSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-[#22396F]">Restaurant details</h2>
          <p className="text-black/60 mb-4">Tell us about your business.</p>
          {[['name', 'Restaurant name'], ['location', 'Location'], ['contactInfo', 'Contact info (phone/email)'], ['logo', 'Logo URL']].map(([name, label]) => (
            <label className="block text-sm font-semibold" key={name}>
              {label}
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                name={name}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, [name]: e.target.value }))}
                placeholder={label}
                required
                value={restaurantForm[name]}
              />
            </label>
          ))}
          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      )
    }

    if (step === 'inventory') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#22396F]">Add your first products</h2>
          <p className="text-black/60 mb-4">Add at least one item you sell.</p>
          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="col-span-full sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Product name</label>
              <input
                className="min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                name="name"
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Coffee"
                required
                value={productForm.name}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Price (KES)</label>
              <input
                className="min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                inputMode="numeric"
                name="price"
                onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                required
                value={productForm.price}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                className="min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                name="category"
                onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                value={productForm.category}
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </div>
            <div className="col-span-full sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Stock quantity</label>
              <input
                className="min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                inputMode="numeric"
                name="stockQuantity"
                onChange={(e) => setProductForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                placeholder="0"
                required
                value={productForm.stockQuantity}
              />
            </div>
            <button
              className="col-span-full sm:col-span-1 min-h-11 rounded-xl bg-[#22396F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
              disabled={submitting}
              type="submit"
            >
              Add
            </button>
          </form>

          {products.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-[#22396F] mb-2">Products added</h3>
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p._id} className="flex justify-between items-center p-3 rounded-xl border border-black/10 bg-black/5">
                    <span className="text-sm">{p.name}</span>
                    <span className="text-sm text-black/60">KES {p.price} • {p.stockQuantity} in stock</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <button
            onClick={nextStep}
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
            disabled={submitting || products.length === 0}
          >
            {submitting ? 'Saving…' : products.length === 0 ? 'Add at least one product' : 'Continue'}
          </button>
        </div>
      )
    }

    if (step === 'cashiers') {
      return (
        <form onSubmit={handleCashierSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-[#22396F]">Create your first cashier</h2>
          <p className="text-black/60 mb-4">Add a cashier who will use the POS.</p>
          {[['name', 'Cashier name'], ['username', 'Username'], ['pin', 'Default PIN (6 digits)']].map(([name, label]) => (
            <label className="block text-sm font-semibold" key={name}>
              {label}
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#22396F]"
                inputMode={name === 'pin' || name === 'username' ? 'numeric' : 'text'}
                maxLength={name === 'pin' ? 20 : 40}
                minLength={name === 'pin' ? 4 : 1}
                name={name}
                onChange={(e) => setCashierForm((f) => ({ ...f, [name]: e.target.value }))}
                placeholder={label}
                required
                type={name === 'pin' ? 'password' : 'text'}
                value={cashierForm[name]}
              />
            </label>
          ))}
          <button
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Creating…' : 'Create cashier and continue'}
          </button>
        </form>
      )
    }

    if (step === 'complete') {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#22396F] mb-2">Onboarding complete</h2>
          <p className="text-black/60 mb-6">
            Your restaurant is set up. You can now manage your business from the administration panel.
          </p>
          <button
            onClick={handleComplete}
            className="min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Finishing…' : 'Go to dashboard'}
          </button>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-black/60">Loading onboarding…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#E8EDF2] p-6">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm font-semibold text-[#22396F] hover:underline">
            Karibu POS
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-black/40">
            Onboarding
          </span>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mb-4 flex gap-2">
          {['restaurant', 'inventory', 'cashiers', 'complete'].map((s) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                status?.onboardingStep === s
                  ? 'bg-[#22396F] text-white'
                  : orderIndex(s) < orderIndex(status?.onboardingStep || 'restaurant')
                    ? 'bg-[#22396F]/10 text-[#22396F]'
                    : 'bg-black/10 text-black/40'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>

        {renderStep()}
      </section>
    </main>
  )
}

const orderIndex = (step) => {
  const order = ['restaurant', 'inventory', 'cashiers', 'complete']
  return order.indexOf(step)
}

export default OnboardingPage