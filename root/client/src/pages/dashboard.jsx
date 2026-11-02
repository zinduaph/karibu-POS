import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/sidebar'
import { syncOfflineOrders } from '../services/offlineOrderSync'
import { useAuth } from '../context/useAuth'

const Dashboard = () => {
    const { user } = useAuth()

    useEffect(() => {
        const syncIfOnline = () => {
            if (navigator.onLine && user?.restaurantId) {
                syncOfflineOrders(user.restaurantId).catch(error => {
                    console.error('Unable to sync locally saved orders:', error)
                })
            }
        }

        syncIfOnline()
        window.addEventListener('online', syncIfOnline)
        const retryInterval = window.setInterval(syncIfOnline, 30000)

        return () => {
            window.removeEventListener('online', syncIfOnline)
            window.clearInterval(retryInterval)
        }
    }, [user?.restaurantId])

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