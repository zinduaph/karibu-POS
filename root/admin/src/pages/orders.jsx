import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getSales } from '../services/salesApi'

function Orders() {
  const { accessToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getSales(accessToken, page)
      .then((result) => {
        if (!active) return
        setOrders(result.sales)
        setTotalPages(result.totalPages)
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
  }, [accessToken, page])

  function changePage(nextPage) {
    setLoading(true)
    setError('')
    setPage(nextPage)
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatOrderItems(order) {
    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ name: order.productName, quantity: order.quantity }]

    return items
      .map((item) => `${item.name || 'Item'} × ${item.quantity || 1}`)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Orders</h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitor customer orders, items, totals, payment status, and date.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-red-700" role="alert">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500" role="status">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#547A95]/10 text-xl font-bold text-[#547A95]">
              —
            </div>
            <p className="mt-4 font-semibold text-[#2C3947]">No orders to display yet.</p>
            <p className="mt-1 text-sm text-slate-500">Orders will appear here when they are created.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#547A95]/15 bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {['Order', 'Items', 'Total', 'Status', 'Date'].map((column) => (
                      <th className="px-5 py-4 font-semibold" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const orderId = order.orderId || order._id
                    const status = order.paymentStatus || 'pending'

                    return (
                      <tr className="align-top text-[#2C3947]" key={order._id || orderId}>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          #{String(orderId || '—').slice(-8).toUpperCase()}
                        </td>
                        <td className="max-w-sm px-5 py-4 text-slate-600">{formatOrderItems(order)}</td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatCurrency(order.totalAmount ?? (order.price * order.quantity))}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {order.createdAt
                            ? new Intl.DateTimeFormat('en-KE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(order.createdAt))
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#547A95]/15 px-5 py-4">
                <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-[#2C3947] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading || page <= 1}
                    onClick={() => changePage(page - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-[#2C3947] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading || page >= totalPages}
                    onClick={() => changePage(page + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Orders