function Reports() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Review business performance and sales summaries.</p>
      </header>
      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="rounded-xl border border-dashed border-[#547A95]/30 bg-[#547A95]/5 px-5 py-10 text-center">
            <p className="font-semibold text-[#2C3947]">Reports will be available when reporting data is connected.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">This section is ready for your administration workflow. Its records and actions can be connected as the related backend features are added.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reports
