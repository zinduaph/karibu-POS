import { useEffect } from 'react'

const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174'

const AdminRegistrationRedirect = () => {
  useEffect(() => {
    window.location.replace(`${adminAppUrl}/register`)
  }, [])

  return (
    <main className="grid min-h-screen place-items-center bg-[#FCF1D0] px-4 text-center">
      <p className="text-sm text-black/70">
        Taking you to admin registration…{' '}
        <a className="font-semibold text-[#22396F] underline" href={`${adminAppUrl}/register`}>
          Continue
        </a>
      </p>
    </main>
  )
}

export default AdminRegistrationRedirect
