import { Outlet } from 'react-router-dom'
import SideBar from '../components/sidebar'

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#2C3947]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <SideBar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Dashboard
