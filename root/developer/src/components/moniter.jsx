import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Building2,
  CircleCheck,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../services/api'

const money = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

function monthLabel(month) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function Monitoring() {
  const redirectingToLogin = useRef(false)
  const [hostels, setHostels] = useState([])
  const [months, setMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [health, setHealth] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [hostelError, setHostelError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const signOut = useCallback(() => {
    if (redirectingToLogin.current) return
    redirectingToLogin.current = true
    window.localStorage.removeItem('dev_token')
    window.location.replace('/login')
  }, [])

  const loadData = useCallback(async (showErrors = false) => {
    if (redirectingToLogin.current) return

    const token = window.localStorage.getItem('dev_token')
    if (!token) {
      redirectingToLogin.current = true
      window.location.replace('/login')
      return
    }

    const [healthResult, hostelsResult, activityResult] = await Promise.allSettled([
      apiRequest('/api/dev/health', token),
      apiRequest('/api/dev/hostels', token),
      apiRequest('/api/dev/activity?limit=50', token),
    ])

    if (redirectingToLogin.current) return

    const failedResult = [healthResult, hostelsResult, activityResult]
      .find((result) => result.status === 'rejected' && result.reason?.status === 401)
    if (failedResult) {
      redirectingToLogin.current = true
      window.localStorage.removeItem('dev_token')
      toast.error('Your session expired. Please sign in again.')
      window.location.replace('/login')
      return
    }

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value)
    } else if (healthResult.reason?.data) {
      setHealth(healthResult.reason.data)
    } else {
      setHealth(null)
    }

    if (hostelsResult.status === 'fulfilled') {
      setHostels(hostelsResult.value.hostels || [])
      setMonths(hostelsResult.value.months || [])
      setSelectedMonth((current) => current || hostelsResult.value.months?.at(-1) || '')
      setHostelError(false)
    } else {
      setHostelError(true)
    }
    if (activityResult.status === 'fulfilled') {
      setEvents(activityResult.value.events || [])
    }
    setLastUpdated(new Date())
    setLoading(false)

    const hasError = [healthResult, hostelsResult, activityResult]
      .some((result) => result.status === 'rejected')
    if (showErrors && hasError) {
      toast.error('Some monitoring data could not be loaded.')
    } else if (showErrors && !hasError) {
      toast.success('Monitoring data refreshed')
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadData(), 0)
    const interval = window.setInterval(() => loadData(), 30_000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(interval)
    }
  }, [loadData])

  const selectedMonthTotals = useMemo(() => {
    return hostels.reduce((totals, hostel) => {
      const month = hostel.monthlySales?.find((item) => item.month === selectedMonth)
      totals.sales += month?.salesTotal || 0
      totals.count += month?.salesCount || 0
      return totals
    }, { sales: 0, count: 0 })
  }, [hostels, selectedMonth])

  const monthIsSelected = Boolean(selectedMonth)

  return (
    <main className="min-h-screen bg-[#F3F6F8] text-[#2C3947]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#547A95] text-white">
              <Activity size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#547A95]">Karibu POS</p>
              <h1 className="text-lg font-bold">Developer monitoring</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-[#547A95] hover:text-[#547A95] disabled:opacity-60"
              disabled={loading}
              onClick={() => loadData(true)}
              type="button"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-red-600"
              onClick={signOut}
              type="button"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">API status</p>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${health?.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {health?.status === 'ok' ? <CircleCheck size={20} /> : <AlertTriangle size={20} />}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{health?.status === 'ok' ? 'Operational' : 'Unavailable'}</p>
            <p className="mt-1 text-sm text-slate-500">
              Database {health?.database || 'status unknown'}
              {health?.uptimeSeconds != null && ` · Up ${Math.floor(health.uptimeSeconds / 60)} min`}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Registered hostels</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#547A95]/10 text-[#547A95]">
                <Building2 size={20} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{hostels.length}</p>
            <p className="mt-1 text-sm text-slate-500">Accounts created</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Requests to review</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert size={20} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{events.length}</p>
            <p className="mt-1 text-sm text-slate-500">Recent 401, 403, or 429 responses</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Hostel sales</h2>
              <p className="mt-1 text-sm text-slate-500">Completed sales for the last 12 months</p>
            </div>
            <select
              aria-label="Select sales month"
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#547A95]"
              onChange={(event) => setSelectedMonth(event.target.value)}
              value={selectedMonth}
            >
              {months.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}
            </select>
          </div>
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">All hostel sales</p>
              <p className="mt-1 text-xl font-bold">{monthIsSelected ? money.format(selectedMonthTotals.sales) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed transactions</p>
              <p className="mt-1 text-xl font-bold">{monthIsSelected ? selectedMonthTotals.count : '—'}</p>
            </div>
          </div>
          {loading && hostels.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading hostel data…</div>
          ) : hostelError ? (
            <div className="p-10 text-center text-sm text-red-600">Could not load hostel data. Check the API connection and refresh.</div>
          ) : hostels.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No hostel accounts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Hostel</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Sales</th>
                    <th className="px-5 py-3 text-right font-semibold">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hostels.map((hostel) => {
                    const sales = hostel.monthlySales?.find((item) => item.month === selectedMonth)
                    return (
                      <tr className="hover:bg-slate-50/70" key={hostel.id}>
                        <td className="px-5 py-4 font-semibold">{hostel.name}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {hostel.createdAt ? new Date(hostel.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hostel.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {hostel.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">{money.format(sales?.salesTotal || 0)}</td>
                        <td className="px-5 py-4 text-right text-slate-600">{sales?.salesCount || 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-lg font-bold">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">Failed or rate-limited requests to review</p>
            </div>
            <Clock3 className="text-slate-400" size={20} />
          </div>
          {events.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No flagged requests recorded recently.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event, index) => (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4" key={`${event.time}-${index}`}>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${event.status === 429 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {event.status}
                  </span>
                  <span className="font-semibold">{event.method}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{event.path}</span>
                  <span className="text-xs text-slate-500">{event.ip || 'Unknown IP'}</span>
                  <time className="text-xs text-slate-400" dateTime={event.time}>
                    {new Date(event.time).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-400">
          {lastUpdated
            ? `Updates automatically every 30 seconds · Last updated ${lastUpdated.toLocaleTimeString()}`
            : 'Waiting for monitoring data'}
        </p>
      </div>
    </main>
  )
}

export default Monitoring
