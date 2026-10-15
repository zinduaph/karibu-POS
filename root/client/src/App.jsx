import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DashboardHome from './pages/dashboardHome'
import Dashboard from './pages/dashboard'
import Sale from './pages/sale'
import Orders from './pages/orders'
import {Toaster} from 'react-hot-toast'
function App() {
  return (
    <>
    <Toaster/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/dashboard' element={<Dashboard/>} >
       <Route index element={<DashboardHome/>}/>
       <Route path='home' element={<DashboardHome/>}/>
       <Route path='sale' element={<Sale/>}/>
       <Route path='orders' element={<Orders/>}/>

        </Route>
       
      </Routes>
    </>
  )
}

export default App
