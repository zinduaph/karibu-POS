 import { useEffect, useState } from 'react'
 import { User, X } from 'lucide-react'
 import { useAuth } from '../context/useAuth'
 import { resetAdminPassword } from '../services/authApi'
 import { getHotelDetails, saveHotelDetails } from '../services/hotelApi'

 function Settings() {
   const { accessToken, user } = useAuth()
   const [form, setForm] = useState({
     name: '',
     location: '',
     customerCareNumber: '',
     hotelEmail: '',
   })
   const [loading, setLoading] = useState(true)
   const [saving, setSaving] = useState(false)
   const [error, setError] = useState('')
   const [success, setSuccess] = useState('')
   const [passwordmodul, setPasswordModul] = useState(false)
   const [newPassword, setNewPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [passwordError, setPasswordError] = useState('')
   const [passwordSuccess, setPasswordSuccess] = useState('')
   const [savingPassword, setSavingPassword] = useState(false)

   useEffect(() => {
     let active = true
     getHotelDetails(accessToken)
       .then((details) => {
         if (active && details) {
           setForm({
             name: details.name || '',
             location: details.location || '',
             customerCareNumber: details.customerCareNumber || '',
             hotelEmail: details.hotelEmail || '',
           })
         }
       })
       .catch((requestError) => {
         if (active) setError(requestError.message)
       })
       .finally(() => {
         if (active) setLoading(false)
       })
     return () => {
       active = false
     }
   }, [accessToken])

   function updateField(event) {
     setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
   }

   async function handleSubmit(event) {
     event.preventDefault()
     setError('')
     setSuccess('')
     setSaving(true)
     try {
       const details = await saveHotelDetails(accessToken, form)
       setForm({
         name: details.name,
         location: details.location,
         customerCareNumber: details.customerCareNumber,
         hotelEmail: details.hotelEmail || '',
       })
       setSuccess('Hotel details saved.')
     } catch (requestError) {
       setError(requestError.message)
     } finally {
       setSaving(false)
     }
   }

   function closePasswordModal() {
     setPasswordModul(false)
     setNewPassword('')
     setConfirmPassword('')
     setPasswordError('')
     setPasswordSuccess('')
   }

   async function handlePasswordSubmit(event) {
     event.preventDefault()
     setPasswordError('')
     setPasswordSuccess('')
     if (newPassword !== confirmPassword) {
       setPasswordError('The passwords do not match.')
       return
     }

     setSavingPassword(true)
     try {
       const result = await resetAdminPassword(accessToken, newPassword)
       setPasswordSuccess(result.message)
       setNewPassword('')
       setConfirmPassword('')
     } catch (requestError) {
       setPasswordError(requestError.message)
     } finally {
       setSavingPassword(false)
     }
   }
   

   return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Configure your restaurant and POS preferences.</p>
      </header>

      <section className="">
       <div className='bg-white p-6 rounded-md  flex  md:justify-between'>
         <div className="">
            <h2 className="text-2xl font-semibold">Hotel details</h2>
            <form className="mt-6 flex flex-col" onSubmit={handleSubmit}>
                <label htmlFor="hotel-name" className="text-[#547A95] font-semibold">Hotel Name</label>
                <input id="hotel-name" name="name" value={form.name} onChange={updateField} className="w-64 rounded-md border border-gray-700 p-2" type="text" required disabled={loading} />

                <label htmlFor="hotel-location" className="mt-4 text-[#547A95] font-semibold">Location</label>
                <input id="hotel-location" name="location" value={form.location} onChange={updateField} type="text" className="w-64 rounded-md border border-gray-700 p-2" required disabled={loading} />

                <label htmlFor="customer-care-number" className="mt-4 text-[#547A95] font-semibold">Customer care number</label>
                <input id="customer-care-number" name="customerCareNumber" value={form.customerCareNumber} onChange={updateField} type="tel" className="w-64 rounded-md border border-gray-700 p-2" required disabled={loading} />

                <label htmlFor="hotel-email" className="mt-4 text-[#547A95] font-semibold">Hotel email</label>
                <input id="hotel-email" name="hotelEmail" value={form.hotelEmail} onChange={updateField} type="email" placeholder="Optional" className="w-64 rounded-md border border-gray-700 p-2" disabled={loading} />
                
                {success && <p className="mt-4 text-sm text-green-700" role="status">{success}</p>}
                <button type="submit" disabled={loading || saving} className="mt-6 w-28 rounded-md bg-black p-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? 'Loading…' : saving ? 'Saving…' : 'Save'}
                </button>
            </form>
         </div>

         <div className='mt-4'>
            
            <h1 className='text-2xl font-semibold'>Admin profile</h1>
             <div className='m-auto mt-3 flex justify-center'><User size={38}/></div>
             <p className="mt-3 text-center font-medium text-[#2C3947]">{user?.name}</p>
             <p className="mt-1 text-center text-sm text-slate-500">{user?.email}</p>
        
         </div>

         

         

       </div>
      </section>
    </div>
  )
}

export default Settings