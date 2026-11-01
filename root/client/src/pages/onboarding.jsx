import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { markOnboardingComplete } from '../services/authApi'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      await markOnboardingComplete()
      navigate('/dashboard/home', { replace: true })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 py-10 text-black">
      <section className="w-full max-w-md rounded-3xl border border-[#22396F]/10 bg-white p-6 shadow-xl sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#22396F] text-xl font-bold text-white">
          K
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#22396F]">
          Karibu POS · Cashier
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome to the POS</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Your PIN is set. Complete onboarding to start using the point of sale.
        </p>

        <button
          onClick={handleComplete}
          className="mt-6 min-h-12 w-full rounded-xl bg-[#22396F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192b55] disabled:opacity-70"
          disabled={submitting}
        >
          {submitting ? 'Finishing…' : 'Start using POS'}
        </button>

        <p className="mt-4 text-center text-xs text-black/40">
          <Link to="/login" className="text-[#22396F] font-semibold hover:underline">
            Sign out
          </Link>
        </p>
      </section>
    </main>
  )
}

export default OnboardingPage
