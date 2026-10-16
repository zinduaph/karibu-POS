const Footer = () => {
  return (
    <footer className="bg-[#22396F] text-[#FCF1D0]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 md:items-center">
        <div>
          <a
            href="#home"
            aria-label="Karibu POS home"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FCF1D0]"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#FCF1D0] text-lg font-bold text-[#22396F]">
              K
            </span>
            <span className="text-xl font-bold tracking-tight">
              Karibu POS
            </span>
          </a>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#FCF1D0]/75">
            A simpler way to manage sales, stock, and service—so you can focus
            on running your business.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between md:justify-end md:gap-12">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
            {[
              ['Home', '#home'],
              ['Pricing', '#pricing'],
              ['Demo', '#demo'],
              ['Restaurant story', '#preview'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-[#FCF1D0]/80 transition-colors hover:text-[#FCF1D0] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FCF1D0]"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="#demo"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FCF1D0] px-5 py-3 text-sm font-semibold text-[#22396F] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCF1D0]"
          >
            Book a demo
          </a>
        </div>
      </div>

      <div className="border-t border-[#FCF1D0]/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-[#FCF1D0]/65 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Karibu POS. All rights reserved.</p>
          <a
            href="#home"
            className="w-fit transition-colors hover:text-[#FCF1D0] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FCF1D0]"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
