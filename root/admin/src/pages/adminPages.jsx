function SectionPage({ title, description, emptyMessage, columns }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        {columns ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-[#547A95]/15 bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {columns.map((column) => (
                      <th className="px-5 py-4 font-semibold" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#547A95]/10 text-xl font-bold text-[#547A95]">
                —
              </div>
              <p className="mt-4 font-semibold text-[#2C3947]">{emptyMessage}</p>
              <p className="mt-1 text-sm text-slate-500">
                Records will appear here when connected to your POS data.
              </p>
            </div>
          </>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="rounded-xl border border-dashed border-[#547A95]/30 bg-[#547A95]/5 px-5 py-10 text-center">
              <p className="font-semibold text-[#2C3947]">{emptyMessage}</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                This section is ready for your administration workflow. Its
                records and actions can be connected as the related backend
                features are added.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export function ProductsPage() {
  return (
    <SectionPage
      columns={['Product', 'Category', 'Price', 'Availability']}
      description="Review the menu items and prices available in your POS."
      emptyMessage="No products to display yet."
      title="Products"
    />
  )
}

export function SalesPage() {
  return (
    <SectionPage
      columns={['Sale', 'Items', 'Payment method', 'Status', 'Date']}
      description="Review completed and pending point-of-sale transactions."
      emptyMessage="No sales to display yet."
      title="Sales"
    />
  )
}

export function OrdersPage() {
  return (
    <SectionPage
      columns={['Order', 'Items', 'Total', 'Status', 'Date']}
      description="Monitor customer orders and their current status."
      emptyMessage="No orders to display yet."
      title="Orders"
    />
  )
}

export function StaffPage() {
  return (
    <SectionPage
      description="Manage team members and their access to the POS."
      emptyMessage="Staff management is not connected yet."
      title="Staff"
    />
  )
}

export function ReportsPage() {
  return (
    <SectionPage
      description="Review business performance and sales summaries."
      emptyMessage="Reports will be available when reporting data is connected."
      title="Reports"
    />
  )
}

export function SettingsPage() {
  return (
    <SectionPage
      description="Configure your restaurant and POS preferences."
      emptyMessage="Settings are not connected yet."
      title="Settings"
    />
  )
}
