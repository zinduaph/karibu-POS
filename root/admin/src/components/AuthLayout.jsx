function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6F8] px-4 py-10 text-[#2C3947]">
      <section className="w-full max-w-md rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#547A95] text-lg font-bold text-white">K</div>
          <div>
            <p className="font-bold tracking-tight">Karibu POS</p>
            <p className="text-xs font-medium text-[#547A95]">Administration</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </section>
    </main>
  )
}

export default AuthLayout
