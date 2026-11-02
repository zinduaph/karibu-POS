import { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  return (
    <main className="min-h-screen bg-[#E8EDF2] p-6">
      <Toaster />
      <section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#22396F]">Administration dashboard</h1>
        <p className="mt-3 text-sm text-black/60">
          You are signed in to the Karibu POS administration panel.
        </p>
      </section>
    </main>
  )
}

export default AdminDashboard