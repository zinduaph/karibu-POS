import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getSales } from '../services/salesApi'

function Sales() {
  const { accessToken } = useAuth()
  const [sales, setSales] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getSales(accessToken, page, 10, 'completed')
      .then((result) => {
        if (!active) return
        setSales(result.sales)
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

  function formatSaleItems(sale) {
    const items = Array.isArray(sale.items) && sale.items.length > 0
      ? sale.items
      : [{ name: sale.productName, quantity: sale.quantity }]

    return items
      .map((item) => `${item.name || 'Item'} × ${item.quantity || 1}`)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Sales</h1>
        <p className="mt-2 text-sm text-slate-500">Review completed point-of-sale transactions.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-red-700" role="alert">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500" role="status">
            Loading completed sales…
          </div>
        ) : sales.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#547A95]/10 text-xl font-bold text-[#547A95]">
              —
            </div>
            <p className="mt-4 font-semibold text-[#2C3947]">No completed sales yet.</p>
            <p className="mt-1 text-sm text-slate-500">Completed transactions will appear here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#547A95]/15 bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {['Sale', 'Items', 'Total', 'Payment method', 'Date'].map((column) => (
                      <th className="px-5 py-4 font-semibold" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => {
                    const saleId = sale.orderId || sale._id
                    return (
                      <tr className="align-top text-[#2C3947]" key={sale._id || saleId}>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          #{String(saleId || '—').slice(-8).toUpperCase()}
                        </td>
                        <td className="max-w-sm px-5 py-4 text-slate-600">{formatSaleItems(sale)}</td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatCurrency(sale.totalAmount ?? (sale.price * sale.quantity))}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 capitalize text-slate-600">
                          {sale.paymentMethod || 'cash'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {sale.createdAt
                            ? new Intl.DateTimeFormat('en-KE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(sale.createdAt))
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

export default Sales
