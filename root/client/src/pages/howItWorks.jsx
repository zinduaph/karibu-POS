
import { Link } from 'react-router-dom'
import Footer from '../components/footer'
import Navbar from '../components/Navbar'
import adminSignupImage from '../assets/Screenshot 2026-11-16 122225.png'
import adminSignupFinishImage from '../assets/Screenshot 2026-11-16 122557.png'
import cashierStaffImage from '../assets/Screenshot 2026-11-16 122733.png'
import cashierLoginImage from '../assets/Screenshot 2026-11-16 145156.png'

const adminAppUrl = (import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174').replace(/\/+$/, '')

const steps = [
  {
    number: '01',
    title: 'Create your admin account',
    description: 'Open the admin sign-up page and enter your name, restaurant name, email address, and a password of at least 12 characters. Submit the form to create your restaurant and administrator account.',
    image: adminSignupImage,
    imageAlt: 'Admin account registration form with name, restaurant, email, and password fields',
    detail: 'Use an email and password you can access later. Your admin account is for managing the restaurant; cashiers will use their own sign-in details.',
  },
  {
    number: '02',
    title: 'Save your restaurant code',
    description: 'After registration, your unique restaurant code is shown on the confirmation screen. Keep it somewhere secure and share it with the cashiers who need to sign in.',
    image: adminSignupFinishImage,
    imageAlt: 'Final fields and create-account button on the admin registration form',
    detail: 'This is an example code only. Your own restaurant will receive a different code.',
  },
  {
    number: '03',
    title: 'Create a cashier account',
    description: 'Sign in to the admin workspace, open Staff, and create a cashier account with their name, a username, and a temporary six-digit PIN.',
    image: cashierStaffImage,
    imageAlt: 'Admin Staff page showing the create cashier account form',
    detail: 'Give the cashier their username, PIN, and your restaurant code. Share the PIN privately.',
  },
  {
    number: '04',
    title: 'Cashier signs in to the POS',
    description: 'The cashier opens the cashier sign-in page and enters the restaurant code, username, and the PIN you created for them.',
    image: cashierLoginImage,
    imageAlt: 'Cashier sign-in form with restaurant code, username, and PIN fields',
    detail: 'After signing in with the PIN you created, the cashier can start using the point-of-sale workspace.',
  },
]

const HowItWorks = () => {
  return (
    <>
      <Navbar />
      <main className="bg-[#FCF1D0] text-black">
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#22396F]">Getting started</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From admin sign-up to your first cashier
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-black/65">
              Follow these steps to set up your restaurant on Qick Sale and give your cashier secure POS access.
            </p>
            <a
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#22396F] px-6 py-3 text-sm font-semibold text-[#FCF1D0] shadow-sm transition-colors hover:bg-[#192b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
              href={`${adminAppUrl}/signup`}
            >
              Create an admin account
            </a>
          </div>

          <div className="mx-auto mt-12 max-w-5xl space-y-6">
            {steps.map((step) => (
              <article
                className="grid overflow-hidden rounded-3xl border border-[#22396F]/10 bg-white shadow-sm md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                key={step.number}
              >
                <div className="p-6 sm:p-8 lg:p-10">
                  <p className="text-sm font-bold tracking-[0.18em] text-[#22396F]/65">STEP {step.number}</p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#22396F]">{step.title}</h2>
                  <p className="mt-4 leading-7 text-black/70">{step.description}</p>
                  {step.number === '02' && (
                    <div className="mt-5 rounded-2xl border border-[#22396F]/10 bg-[#FCF1D0]/70 p-4">
                      <p className="text-sm font-semibold text-[#22396F]">Example restaurant code</p>
                      <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold tracking-wide text-[#22396F]">
                        KRB-08533AD06938BACD
                      </p>
                    </div>
                  )}
                  <p className="mt-4 rounded-xl bg-[#22396F]/5 p-4 text-sm leading-6 text-black/70">
                    {step.detail}
                  </p>
                  {step.number === '03' && (
                    <a
                      className="mt-5 inline-flex font-semibold text-[#22396F] underline decoration-[#22396F]/30 underline-offset-4 hover:decoration-[#22396F]"
                      href={`${adminAppUrl}/dashboard/staff`}
                    >
                      Open the admin Staff page
                    </a>
                  )}
                  {step.number === '04' && (
                    <Link
                      className="mt-5 inline-flex font-semibold text-[#22396F] underline decoration-[#22396F]/30 underline-offset-4 hover:decoration-[#22396F]"
                      to="/login"
                    >
                      Go to cashier sign in
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-center bg-[#22396F]/5 p-4 sm:p-6">
                  <img
                    alt={step.imageAlt}
                    className="h-auto max-h-[34rem] w-full rounded-2xl border border-[#22396F]/10 bg-white object-contain shadow-sm"
                    loading="lazy"
                    src={step.image}
                  />
                </div>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-5xl text-center text-sm leading-6 text-black/60">
            The restaurant code above is only an example. Use the unique code shown after your own registration when setting up cashier access.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
export default HowItWorks