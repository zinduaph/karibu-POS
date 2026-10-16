import { useState } from 'react'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Demo', href: '#demo' },
]

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#22396F]/10 bg-[#FCF1D0]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"
      >
        <a
          href="#home"
          className="flex items-center gap-3 rounded-lg text-[#22396F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22396F]"
          aria-label="Karibu POS home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#22396F] text-lg font-bold text-[#FCF1D0]">
            K
          </span>
          <span className="text-xl font-bold tracking-tight text-black">
            Karibu <span className="text-[#22396F]">POS</span>
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-black transition-colors hover:text-[#22396F] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22396F]"
            >
              {label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl text-[#22396F] transition-colors hover:bg-[#22396F]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F] md:hidden"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div
          id="mobile-navigation"
          className={`${menuOpen ? 'grid' : 'hidden'} absolute inset-x-0 top-full gap-1 border-b border-[#22396F]/10 bg-[#FCF1D0] px-5 pb-4 pt-2 shadow-lg md:hidden`}
        >
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-4 py-3 font-medium text-black transition-colors hover:bg-[#22396F]/10 hover:text-[#22396F] focus-visible:outline-2 focus-visible:outline-[#22396F]"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
