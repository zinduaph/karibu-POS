 import {User} from 'lucide-react'

function Settings() {
    
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Configure your restaurant and POS preferences.</p>
      </header>

      <section className="">
       <div className='bg-white p-6 rounded-md flex justify-between'>
         <div className="">
            <h1 className="text-2xl font-semibold">Add your Hotel Details</h1>
            <form action="" className="flex flex-col mt-6">
                <label className="text-[#547A95] font-semibold" >Hotel Name</label>
                <input className=" border border-gray-700 p-1 rounded-md w-50" type="text" required id="" />

                <label htmlFor="" className="mt-4 text-[#547A95] font-semibold">Location</label>
                <input type="text" className=" border border-gray-700 p-1 rounded-md w-50" required  />

                <label htmlFor="" className="mt-4 text-[#547A95] font-semibold">customer care Number</label>
                <input type="number" className="border border-gray-700 p-1 rounded-md w-50" required />

                <label htmlFor="" className="mt-4 text-[#547A95] font-semibold">Hotel email</label>
                <input type="text" placeholder="(this filed is optional)" className="border border-gray-700 p-1 rounded-md w-50" />
            </form>
            <button className="bg-black text-white p-2 rounded-md w-20 m-auto ml-30 hover:bg-gray-500 cursor-pointer mt-6">Save</button>
         </div>

         <div>
            
            <h1 className='text-2xl font-semibold'>Admin profile</h1>
             <div className='m-auto mt-3 flex justify-center'><User size={38}/></div>
         </div>

       </div>
      </section>
    </div>
  )
}

export default Settings