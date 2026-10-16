import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";
const Dashboard = () => {

    return (
        <>
        <div className="min-h-screen bg-[#E8EDF2]">
      <div className='flex flex-col md:flex-row'>
        <Sidebar />
        <div className="w-full md:w-[82%] p-5">
         <Outlet />
        </div>
      </div>
    </div>
        </>
    )
}
export default Dashboard