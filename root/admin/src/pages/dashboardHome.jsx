import { Link } from 'react-router-dom'

const summaryCards = [
  { label: 'Sales today', value: '—', note: 'Sales data will appear here' },
  { label: 'Open orders', value: '—', note: 'Order activity will appear here' },
  { label: 'Products', value: '—', note: 'Product totals will appear here' },
]

function DashboardHome() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">
          Overview
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          A quick view of your restaurant operations.
        </p>
      </header>

      <section aria-label="Business summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            className="rounded-2xl border border-[#547A95]/15 bg-white p-5 shadow-sm"
            key={card.label}
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-4 text-3xl font-bold text-[#2C3947]">{card.value}</p>
            <p className="mt-2 text-xs text-slate-400">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#2C3947]">Get started</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a workspace section to manage your point-of-sale operations.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ['Products', '/dashboard/products'],
            ['Sales', '/dashboard/sales'],
            ['Orders', '/dashboard/orders'],
          ].map(([label, to]) => (
            <Link
              className="rounded-xl border border-[#547A95]/25 px-4 py-2.5 text-sm font-semibold text-[#547A95] transition hover:border-[#547A95] hover:bg-[#547A95]/5"
              key={to}
              to={to}
            >
              View {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardHome
