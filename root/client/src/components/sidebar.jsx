
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const SideBar = () => {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const links = [
        { to:'/dashboard/home', label:"Home"},
         { to:'/dashboard/sale', label:"Sale"},
          { to:'/dashboard/orders', label:"Orders"},

    ]

    return (
      <>
      <div className="w-full md:w-[18%] min-h-screen md:mt-10 p-5 border-b-2 md:border-b-0 md:border-r-2 border-[#547A96]/20 bg-white">
      <div className="flex flex-col gap-3 font-bold">
        {links.map((link) => (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            className={({ isActive }) =>
              `w-full rounded-2xl border px-2 py-2 text-left text-sm transition ${
                isActive
                  ? 'bg-[#547A95] text-white border-[#547A95]'
                  : 'bg-white text-[#2C3947] border-[#547A95]/30 hover:border-[#547A95]/50'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <button
          className="w-full rounded-2xl border border-[#547A95]/30 bg-white px-2 py-2 text-left text-sm text-[#2C3947] transition hover:border-[#547A95]/50"
          onClick={async () => {
            const notice = await logout()
            navigate('/login', { replace: true, state: notice ? { notice } : undefined })
          }}
          type="button"
        >
          Sign out
        </button>
      </div>
    </div>

      </>  
    )
}
export default SideBar;