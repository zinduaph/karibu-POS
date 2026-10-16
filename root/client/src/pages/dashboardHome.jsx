import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSales } from '../services/salesApi'

const icons = {
  arrow: (
    <path
      d="M4 12h16m-6-6 6 6-6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7v5l3.2 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  receipt: (
    <path
      d="M6 3.75h12v16.5l-3-1.8-3 1.8-3-1.8-3 1.8V3.75Zm3.25 5h5.5m-5.5 4h5.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  spark: (
    <path
      d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm6.5 11.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  trend: (
    <path
      d="m4 16 5-5 3.5 3.5L20 7m-5 0h5v5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

const Icon = ({ name, className = 'size-5' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    {icons[name]}
  </svg>
)

const summaryCards = [
  { label: "Today's sales", icon: 'trend' },
  { label: 'Transactions', icon: 'receipt' },
  { label: 'Average sale', icon: 'spark' },
]

const quickActions = [
  {
    title: 'Start a new sale',
    description: 'Open checkout and serve your next customer.',
    to: '/dashboard/sale',
    icon: 'arrow',
    style: 'bg-[#22396F] text-white hover:bg-[#192b55]',
    iconStyle: 'bg-white/10 text-[#FCF1D0]',
  },
  {
    title: 'View orders',
    description: 'Check orders and follow up on recent activity.',
    to: '/dashboard/orders',
    icon: 'receipt',
    style:
      'border border-[#22396F]/15 bg-white text-[#22396F] hover:border-[#22396F]/35 hover:bg-[#FCF1D0]/50',
    iconStyle: 'bg-[#FCF1D0] text-[#22396F]',
  },
]

const DashboardHome = () => {
  const [sales, setSales] = useState([])
  const [salesError, setSalesError] = useState('')
  const today = new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  useEffect(() => {
    getSales()
      .then((response) => setSales(response.sales))
      .catch((error) => {
        console.error('Unable to load dashboard sales:', error)
        setSalesError(error.message || 'Sales summary could not be loaded.')
      })
  }, [])

  const todaySales = useMemo(() => {
    const now = new Date()
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      return (
        sale.paymentStatus === 'completed' &&
        saleDate.getFullYear() === now.getFullYear() &&
        saleDate.getMonth() === now.getMonth() &&
        saleDate.getDate() === now.getDate()
      )
    })
  }, [sales])
  const totalToday = todaySales.reduce(
    (total, sale) => total + Number(sale.totalAmount),
    0,
  )
  const averageToday = todaySales.length
    ? totalToday / todaySales.length
    : 0
  const summaryValues = [
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(totalToday),
    String(todaySales.length),
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(averageToday),
  ]
  const recentSales = sales.slice(0, 5)

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-[#FCF1D0] p-6 shadow-sm sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-20 size-64 rounded-full border-[32px] border-[#22396F]/5 sm:size-80"
        />
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#22396F]/10 bg-white/65 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#22396F]">
              <span className="size-2 rounded-full bg-emerald-600" />
              Cashier dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Welcome to your shift
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/65 sm:text-base">
              Your checkout shortcuts and daily overview, all in one place.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#22396F]/10 bg-white/70 px-4 py-3 text-sm font-medium text-[#22396F]">
            <Icon name="clock" className="size-5 shrink-0" />
            <time>{today}</time>
          </div>
        </div>
      </header>

      <section aria-labelledby="today-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="today-heading"
              className="text-lg font-bold tracking-tight text-[#2C3947] sm:text-xl"
            >
              Today at a glance
            </h2>
            <p className="mt-1 text-sm text-[#2C3947]/65">
              Your shift&apos;s sales summary
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map(({ label, icon }, index) => (
            <article
              key={label}
              className="rounded-2xl border border-[#547A95]/15 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[#2C3947]/75">{label}</p>
                <span className="grid size-10 place-items-center rounded-xl bg-[#FCF1D0] text-[#22396F]">
                  <Icon name={icon} />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-black">
                {salesError ? '—' : summaryValues[index]}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#2C3947]/55">
                {salesError || 'Based on completed sales today.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="actions-heading">
        <div className="mb-4">
          <h2
            id="actions-heading"
            className="text-lg font-bold tracking-tight text-[#2C3947] sm:text-xl"
          >
            Ready for what&apos;s next?
          </h2>
          <p className="mt-1 text-sm text-[#2C3947]/65">
            Jump straight into the tools you use most.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map(
            ({ title, description, to, icon, style, iconStyle }) => (
              <Link
                key={title}
                to={to}
                className={`group flex min-h-36 items-center justify-between gap-4 rounded-2xl p-5 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F] sm:p-6 ${style}`}
              >
                <span className="flex items-center gap-4">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl ${iconStyle}`}
                  >
                    <Icon name={icon} />
                  </span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="mt-1 block max-w-xs text-sm leading-5 opacity-75">
                      {description}
                    </span>
                  </span>
                </span>
                <Icon
                  name="arrow"
                  className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                />
              </Link>
            ),
          )}
        </div>
      </section>

      <section
        aria-labelledby="activity-heading"
        className="rounded-2xl border border-[#547A95]/15 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="activity-heading"
              className="text-lg font-bold tracking-tight text-[#2C3947]"
            >
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-[#2C3947]/65">
              Keep an eye on the latest transactions.
            </p>
          </div>
          <Link
            to="/dashboard/orders"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#22396F] transition-colors hover:bg-[#FCF1D0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
          >
            View orders
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        {recentSales.length > 0 ? (
          <ul className="mt-5 divide-y divide-[#547A95]/10">
            {recentSales.map((sale) => (
              <li
                key={sale._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2C3947]">
                    {sale.productName}
                  </p>
                  <p className="mt-1 text-xs text-[#2C3947]/60">
                    {new Intl.DateTimeFormat('en-KE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(sale.createdAt))}
                    {' · '}
                    {sale.paymentStatus}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-[#22396F]">
                  {new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                    maximumFractionDigits: 0,
                  }).format(sale.totalAmount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-[#547A95]/25 bg-[#E8EDF2]/35 px-4 py-9 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-[#FCF1D0] text-[#22396F]">
              <Icon name="receipt" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#2C3947]">
              {salesError ? 'Recent sales unavailable' : 'No sales yet'}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-[#2C3947]/60">
              {salesError || 'New sales will appear here after they are created.'}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default DashboardHome
