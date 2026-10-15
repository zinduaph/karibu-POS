import posImage from '../assets/pos-system.jpg'

const benefits = [
  'Keep sales moving with a faster checkout',
  'Know what is in stock at a glance',
  'See how your business is performing',
]

const Hero = () => {
  return (
    <main id="home" className="overflow-hidden bg-[#FCF1D0]">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22396F]/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#22396F]">
            
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black sm:text-5xl lg:text-6xl">
            Spend less time managing sales.
            <span className="mt-2 block text-[#22396F]">More time growing your business.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-black/70">
            Karibu POS brings your checkout, stock, and sales insights together
            in one straightforward system, so you can serve customers
            confidently and keep your day running smoothly.
          </p>

          <ul className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm font-medium text-black sm:text-base">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#22396F] text-[#FCF1D0]">
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-3.5">
                    <path d="m5 10 3.2 3.2L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#22396F] px-6 py-3 text-sm font-semibold text-[#FCF1D0] shadow-sm transition-colors hover:bg-[#192b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
            >
              Book a demo
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="ml-2 size-4">
                <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#22396F]/25 px-6 py-3 text-sm font-semibold text-[#22396F] transition-colors hover:bg-[#22396F]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
            >
              Explore pricing
            </a>
          </div>

          <p className="mt-5 text-sm text-black/60">
            Simple tools for smoother service and clearer day-to-day decisions.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-[#22396F]/10 sm:-inset-6" />
          <img
            src={posImage}
            alt="Point-of-sale touchscreen ready for serving customers in a restaurant"
            className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-black/10"
          />
          <div className="absolute -bottom-5 left-4 right-4 rounded-2xl bg-white p-4 shadow-xl sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs sm:p-5">
            <p className="text-sm font-semibold text-[#22396F]">Everything in one place</p>
            <p className="mt-1 text-sm leading-6 text-black/65">
              Sales, stock, and service—easy to follow from one screen.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Hero
