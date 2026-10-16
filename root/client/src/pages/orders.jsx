import { useEffect, useMemo, useState } from 'react'
import { collectCashPayment, getSales } from '../services/salesApi'

const filters = [
  { label: 'All orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'completed' },
]

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getOrderId = (order) => order.orderId || order.id || 'Order ID unavailable'

const mapSaleToOrder = (sale) => ({
  id: sale._id,
  orderId: sale.orderId || sale._id,
  createdAt: sale.createdAt,
  items:
    Array.isArray(sale.items) && sale.items.length > 0
      ? sale.items.map((item, index) => ({
          id: `${sale._id}-${index}`,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
        }))
      : [
          {
            id: sale._id,
            name: sale.productName,
            price: Number(sale.price),
            quantity: Number(sale.quantity),
          },
        ],
  total: Number(sale.totalAmount),
  paymentStatus: sale.paymentStatus,
  paymentMethod: sale.paymentMethod,
  amountReceived: sale.amountReceived,
  change: sale.change,
})

const Icon = ({ name, className = 'size-5' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {name === 'receipt' && (
      <path d="M6 3.75h12v16.5l-3-1.8-3 1.8-3-1.8-3 1.8V3.75Zm3.25 5h5.5m-5.5 4h5.5" />
    )}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'cash' && (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M7 10h.01M17 14h.01" />
      </>
    )}
    {name === 'phone' && (
      <>
        <rect x="7" y="2.75" width="10" height="18.5" rx="2" />
        <path d="M10 6h4m-3 12h2" />
      </>
    )}
    {name === 'check' && <path d="m5 12 4 4L19 6" />}
  </svg>
)

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [storageError, setStorageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [cashReceived, setCashReceived] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getSales()
        setOrders(response.sales.map(mapSaleToOrder))
        setStorageError('')
      } catch (error) {
        console.error('Unable to load sales from the backend:', error)
        setStorageError(error.message || 'Orders could not be loaded from the backend.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  const visibleOrders = useMemo(() => {
    const sortedOrders = [...orders].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )

    return activeFilter === 'all'
      ? sortedOrders
      : sortedOrders.filter((order) => order.paymentStatus === activeFilter)
  }, [activeFilter, orders])

  const openCashPayment = (order) => {
    setPaymentOrder(order)
    setCashReceived('')
    setPaymentError('')
  }

  const closeCashPayment = () => {
    setPaymentOrder(null)
    setCashReceived('')
    setPaymentError('')
  }

  const confirmCashPayment = async (event) => {
    event.preventDefault()
    if (!paymentOrder || isPaying) return

    const received = Number(cashReceived)
    if (!Number.isFinite(received) || received < paymentOrder.total) {
      setPaymentError(
        `Enter an amount of at least ${formatPrice(paymentOrder.total)}.`,
      )
      return
    }

    setIsPaying(true)
    try {
      const response = await collectCashPayment({
        orderId: paymentOrder.orderId,
        amountReceived: received,
      })
      const updatedOrder = mapSaleToOrder(response.sale)
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          getOrderId(order) === getOrderId(paymentOrder)
            ? updatedOrder
            : order,
        ),
      )
      setStorageError('')
      closeCashPayment()
    } catch (error) {
      console.error('Unable to record cash payment:', error)
      setPaymentError(error.message || 'Payment could not be recorded. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  const pendingCount = orders.filter(
    (order) => order.paymentStatus === 'pending',
  ).length
  const paidCount = orders.filter(
    (order) => order.paymentStatus === 'completed',
  ).length

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8 text-black">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#22396F]">
            Cashier · Order management
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Orders
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
            Review food and drink orders, take payment, and confirm when a
            customer has paid.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs font-medium text-black/55">Pending</p>
            <p className="mt-0.5 text-lg font-bold">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs font-medium text-black/55">Paid</p>
            <p className="mt-0.5 text-lg font-bold">{paidCount}</p>
          </div>
        </div>
      </header>

      <div
        role="note"
        className="rounded-xl border border-[#22396F]/15 bg-[#FCF1D0] px-4 py-3 text-sm leading-5 text-black/75"
      >
        Orders and payment status are loaded from the backend. M-Pesa sales
        update after the payment callback is received.
      </div>

      {storageError && (
        <p
          role="alert"
          className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
        >
          {storageError}
        </p>
      )}

      <section aria-label="Filter orders">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(({ label, value }) => {
            const count =
              value === 'all'
                ? orders.length
                : orders.filter((order) => order.paymentStatus === value).length

            return (
              <button
                key={value}
                type="button"
                aria-pressed={activeFilter === value}
                onClick={() => setActiveFilter(value)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                  activeFilter === value
                    ? 'bg-black text-white'
                    : 'border border-black/15 bg-white text-black/70 hover:border-black/35 hover:text-black'
                }`}
              >
                {label}
                <span className="ml-2 opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </section>

      {isLoading ? (
        <p role="status" className="rounded-xl bg-white px-4 py-8 text-center text-sm text-black/60">
          Loading orders…
        </p>
      ) : visibleOrders.length > 0 ? (
        <section
          aria-label={`${activeFilter === 'all' ? 'All' : activeFilter} orders`}
          className="grid gap-4 lg:grid-cols-2"
        >
          {visibleOrders.map((order, index) => {
            const isPaid = order.paymentStatus === 'completed'
            const orderId = getOrderId(order)
            const items = Array.isArray(order.items) ? order.items : []

            return (
              <article
                key={`${orderId}-${index}`}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-bold tracking-wide">
                      {orderId}
                    </p>
                    <p className="mt-1 text-xs text-black/55">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-800'
                        : order.paymentStatus === 'failed'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-[#FCF1D0] text-[#2C3947]'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-600'
                          : order.paymentStatus === 'failed'
                            ? 'bg-red-600'
                            : 'bg-amber-600'
                      }`}
                    />
                    {isPaid
                      ? 'Paid'
                      : order.paymentStatus === 'failed'
                        ? 'Payment failed'
                        : 'Pending'}
                  </span>
                </div>

                <div className="px-5 py-4">
                  {items.length > 0 ? (
                    <ul className="space-y-3">
                      {items.map((item, itemIndex) => (
                        <li
                          key={`${item.id || item.name}-${itemIndex}`}
                          className="flex items-start justify-between gap-4 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="font-medium">{item.name}</span>
                            <span className="ml-2 text-xs text-black/50">
                              × {item.quantity}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-black/55">
                      Item details are unavailable for this order.
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-black/15 pt-4">
                    <span className="text-sm font-semibold text-black/65">
                      Order total
                    </span>
                    <span className="text-lg font-bold">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {isPaid && order.paymentMethod === 'cash' && (
                    <p className="mt-2 text-right text-xs text-black/55">
                      Cash received {formatPrice(order.amountReceived ?? 0)}
                      {typeof order.change === 'number' &&
                        ` · Change ${formatPrice(order.change)}`}
                    </p>
                  )}
                </div>

                {!isPaid &&
                  order.paymentStatus !== 'failed' &&
                  (order.paymentMethod === 'cash' ? (
                    <div className="border-t border-black/10 bg-[#E8EDF2]/35 p-4">
                      <button
                        type="button"
                        onClick={() => openCashPayment(order)}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#22396F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        <Icon name="cash" className="size-4" />
                        Record cash payment
                      </button>
                    </div>
                  ) : (
                    <p className="border-t border-black/10 bg-[#E8EDF2]/35 px-4 py-3 text-center text-sm text-black/60">
                      M-Pesa prompt sent; awaiting payment confirmation.
                    </p>
                  ))}
              </article>
            )
          })}
        </section>
      ) : (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-white px-5 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#E8EDF2] text-black/60">
            <Icon name="receipt" />
          </span>
          <h2 className="mt-4 font-bold">
            {orders.length === 0
              ? 'No orders yet'
              : activeFilter === 'all'
                ? 'No orders found'
                : `No ${activeFilter === 'completed' ? 'paid' : activeFilter} orders`}
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-5 text-black/55">
            {orders.length === 0
              ? 'Orders created from the Sale page will appear here.'
              : 'Try another filter to see more orders.'}
          </p>
        </section>
      )}

      {paymentOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCashPayment()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cash-dialog-heading"
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#22396F]">
                  Cash payment
                </p>
                <h2
                  id="cash-dialog-heading"
                  className="mt-1 text-xl font-bold"
                >
                  Confirm payment
                </h2>
                <p className="mt-1 break-all text-sm text-black/55">
                  Order {getOrderId(paymentOrder)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCashPayment}
                aria-label="Close cash payment dialog"
                className="grid size-10 shrink-0 place-items-center rounded-xl text-black/55 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-black"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={confirmCashPayment} className="mt-6">
              <div className="flex items-center justify-between rounded-xl bg-[#E8EDF2]/60 px-4 py-3">
                <span className="text-sm font-medium text-black/65">
                  Amount due
                </span>
                <span className="text-lg font-bold">
                  {formatPrice(paymentOrder.total)}
                </span>
              </div>

              <label
                htmlFor="cash-received"
                className="mt-5 block text-sm font-semibold"
              >
                Cash received
              </label>
              <div className="mt-2 flex min-h-12 items-center rounded-xl border border-black/20 px-3 focus-within:border-[#22396F] focus-within:ring-2 focus-within:ring-[#22396F]/15">
                <span className="mr-2 text-sm font-semibold text-black/55">
                  KES
                </span>
                <input
                  id="cash-received"
                  type="number"
                  min={paymentOrder.total}
                  step="1"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={cashReceived}
                  onChange={(event) => {
                    setCashReceived(event.target.value)
                    setPaymentError('')
                  }}
                  placeholder={String(paymentOrder.total)}
                  className="min-w-0 flex-1 bg-transparent py-2 text-base text-black outline-none placeholder:text-black/35"
                />
              </div>
              <p className="mt-2 text-xs text-black/55">
                The amount must be at least the order total.
              </p>

              {cashReceived !== '' &&
                Number.isFinite(Number(cashReceived)) &&
                Number(cashReceived) >= paymentOrder.total && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-700/15 bg-emerald-50 px-4 py-3">
                    <span className="text-sm font-medium text-emerald-900">
                      Change due
                    </span>
                    <span className="font-bold text-emerald-900">
                      {formatPrice(Number(cashReceived) - paymentOrder.total)}
                    </span>
                  </div>
                )}

              {paymentError && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-700">
                  {paymentError}
                </p>
              )}

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeCashPayment}
                  className="min-h-11 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#22396F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <Icon name="check" className="size-4" />
                  {isPaying ? 'Recording payment…' : 'Confirm paid'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </main>
  )
}

export default Orders
