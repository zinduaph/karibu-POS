
const plans = [
    {
        name: 'Starter',
        monthly: 2315,
        features: [
            'Point-of-sale checkout',
            'Menu and product catalog',
            'Daily sales overview',
        ],
    },
    {
        name: 'Standard',
        monthly: 3520,
        features: [
            'Everything in Starter',
            'Order history and tracking',
            'Inventory and stock management',
        ],
    },
    {
        name: 'Pro',
        monthly: 5000,
        features: [
            'Everything in Standard',
            'Cashier accounts and role-based access',
            'Sales and inventory reports',
        ],
    },
]

const Pricing = () => {
    return (
        <section
            id="pricing"
            aria-labelledby="pricing-heading"
            className="bg-white px-5 py-16 sm:px-8 sm:py-20"
        >
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-[#22396F]">
                        Simple monthly pricing
                    </p>
                    <h2
                        id="pricing-heading"
                        className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#22396F] sm:text-4xl"
                    >
                        Choose the plan that fits your business.
                    </h2>
                    <p className="mt-4 leading-7 text-black/70">
                        Clear monthly costs for the tools that help keep your sales, stock, and service organized.
                    </p>
                </div>

                <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
                    {plans.map((plan) => (
                        <article
                            key={plan.name}
                            className="flex flex-col rounded-2xl border border-[#22396F]/15 bg-[#FCF1D0]/45 p-6 sm:p-8"
                        >
                            <h3 className="text-lg font-bold text-[#22396F]">{plan.name}</h3>
                            <p className="mt-2 text-sm leading-6 text-black/65">
                                Everything you need to run your day-to-day sales with Qick Sale.
                            </p>

                            <p className="mt-6 flex items-baseline gap-2 text-[#22396F]">
                                <span className="text-sm font-semibold">KES</span>
                                <span className="text-4xl font-bold tracking-tight">
                                    {plan.monthly.toLocaleString('en-KE')}
                                </span>
                                <span className="text-sm text-black/60">/ month</span>
                            </p>

                            <ul className="mt-6 space-y-3 border-t border-[#22396F]/10 pt-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-black/75">
                                        <span
                                            aria-hidden="true"
                                            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#22396F] text-[#FCF1D0]"
                                        >
                                            <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
                                                <path
                                                    d="m5 10 3.2 3.2L15 6.5"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="/admin/register"
                                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22396F] px-5 py-3 text-sm font-semibold text-[#FCF1D0] transition-colors hover:bg-[#192b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
                            >
                                Get started
                            </a>
                        </article>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-black/65">
                    Need help choosing?{' '}
                    <a
                        href="#contact"
                        className="font-semibold text-[#22396F] underline decoration-[#22396F]/40 underline-offset-4 hover:decoration-[#22396F] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
                    >
                        Contact us
                    </a>
                </p>
            </div>
        </section>
    )
}
export default Pricing;