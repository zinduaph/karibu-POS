import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard/home', label: 'Overview', icon: 'grid' },
  { to: '/dashboard/products', label: 'Products', icon: 'box' },
  { to: '/dashboard/sales', label: 'Sales', icon: 'chart' },
  { to: '/dashboard/orders', label: 'Orders', icon: 'receipt' },
  { to: '/dashboard/staff', label: 'Staff', icon: 'users' },
  { to: '/dashboard/reports', label: 'Reports', icon: 'report' },
  { to: '/dashboard/settings', label: 'Settings', icon: 'settings' },
]

const iconPaths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  report: <><path d="M5 3h14v18H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.8Z" transform="translate(-1 -1)" /></>,
}

function SidebarIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  )
}

function SideBar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#547A95]/20 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 border-b border-[#547A95]/15 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#547A95] text-lg font-bold text-white">
          K
        </div>
        <div>
          <p className="font-bold tracking-tight text-[#2C3947]">Karibu POS</p>
          <p className="text-xs font-medium text-[#547A95]">Administration</p>
        </div>
      </div>

      <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:px-3 md:py-6">
        <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-wider text-[#547A95]/70 md:block">
          Workspace
        </p>
        {links.map(({ to, label, icon }) => (
          <NavLink
            end
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#547A95] text-white shadow-sm'
                  : 'text-[#2C3947] hover:bg-[#547A95]/10 hover:text-[#547A95]'
              }`
            }
          >
            <SidebarIcon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden border-t border-[#547A95]/15 p-4 md:block">
        <div className="flex items-center gap-3 rounded-xl bg-[#547A95]/5 p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#547A95]/15 text-sm font-bold text-[#547A95]">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C3947]">Administrator</p>
            <p className="text-xs text-[#547A95]">Admin account</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default SideBar
