import { useMemo, useState } from 'react'
import { createSale } from '../services/salesApi'
import toast from 'react-hot-toast'

const menuItems = [
  {
    id: 'beef-burger',
    name: 'Beef burger',
    description: 'Grilled beef, lettuce, tomato and house sauce',
    category: 'Food',
    price: 650,
    mark: '🍔',
    color: 'bg-[#FCF1D0]',
  },
  {
    id: 'chicken-pilau',
    name: 'Chicken pilau',
    description: 'Spiced rice served with tender chicken',
    category: 'Food',
    price: 550,
    mark: '🍗',
    color: 'bg-[#E8EDF2]',
  },
  {
    id: 'ugali-beef',
    name: 'Ugali & beef stew',
    description: 'A comforting local favourite with greens',
    category: 'Food',
    price: 480,
    mark: '🍲',
    color: 'bg-[#FCF1D0]',
  },
  {
    id: 'chips-masala',
    name: 'Chips masala',
    description: 'Crispy chips tossed in a tangy masala sauce',
    category: 'Food',
    price: 350,
    mark: '🍟',
    color: 'bg-[#E8EDF2]',
  },
  {
    id: 'grilled-chicken',
    name: 'Grilled chicken',
    description: 'Char-grilled chicken with a side of your choice',
    category: 'Food',
    price: 750,
    mark: '🍗',
    color: 'bg-[#FCF1D0]',
  },
  {
    id: 'vegetable-wrap',
    name: 'Vegetable wrap',
    description: 'Fresh vegetables wrapped with a light dressing',
    category: 'Food',
    price: 400,
    mark: '🌯',
    color: 'bg-[#E8EDF2]',
  },
  {
    id: 'fresh-juice',
    name: 'Fresh juice',
    description: 'Freshly blended seasonal fruit juice',
    category: 'Drinks',
    price: 200,
    mark: '🧃',
    color: 'bg-[#FCF1D0]',
  },
  {
    id: 'soda',
    name: 'Soda',
    description: 'Chilled soft drink',
    category: 'Drinks',
    price: 100,
    mark: '🥤',
    color: 'bg-[#E8EDF2]',
  },
  {
    id: 'bottled-water',
    name: 'Bottled water',
    description: 'Still water, served chilled',
    category: 'Drinks',
    price: 80,
    mark: '💧',
    color: 'bg-[#FCF1D0]',
  },
  {
    id: 'tea',
    name: 'Kenyan tea',
    description: 'Freshly brewed tea with milk',
    category: 'Drinks',
    price: 120,
    mark: '☕',
    color: 'bg-[#E8EDF2]',
  },
]

const categories = ['All items', 'Food', 'Drinks']

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)

const Icon = ({ name, className = 'size-5' }) => {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      {...shared}
    >
      {name === 'search' && (
        <>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4 4" />
        </>
      )}
      {name === 'bag' && (
        <>
          <path d="M5 8h14l1 12H4L5 8Z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </>
      )}
      {name === 'plus' && <path d="M12 5v14m-7-7h14" />}
      {name === 'minus' && <path d="M5 12h14" />}
      {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
      {name === 'receipt' && (
        <path d="M6 3.75h12v16.5l-3-1.8-3 1.8-3-1.8-3 1.8V3.75Zm3.25 5h5.5m-5.5 4h5.5" />
      )}
    </svg>
  )
}

const Sale = () => {
  const [activeCategory, setActiveCategory] = useState('All items')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [latestOrder, setLatestOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'All items' || item.category === activeCategory
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const orderTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  const addToCart = (menuItem) => {
    setLatestOrder(null)
    
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === menuItem.id)
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...currentCart, { ...menuItem, quantity: 1 }]
    })
  }

  const changeQuantity = (itemId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (itemId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== itemId))
  }

  const createOrder = async () => {
    if (cart.length === 0 || isSubmitting) return
    if (paymentMethod === 'mpesa' && !phoneNumber.trim()) {
      toast.error('Enter the phone number for the M-Pesa prompt.')
      return
    }
    setIsSubmitting(true)
    
    try {
      const response = await createSale({
        productName: `${cart.length} item${cart.length === 1 ? '' : 's'}`,
        price: orderTotal,
        quantity: 1,
        items: cart.map(({ name, category, price, quantity }) => ({
          name,
          category,
          price,
          quantity,
        })),
        paymentMethod,
        ...(paymentMethod === 'mpesa' ? { phoneNumber } : {}),
      })
      const sale = response.sale
      setLatestOrder({
        id: sale.orderId || sale._id,
        total: sale.totalAmount,
        createdAt: sale.createdAt,
        paymentMethod: sale.paymentMethod,
      })
      setCart([])
      setPhoneNumber('')
    } catch (error) {
      console.error('Unable to create sale:', error)
      if (error.data?.sale) {
        const sale = error.data.sale
        setLatestOrder({
          id: sale.orderId || sale._id,
          total: sale.totalAmount,
          createdAt: sale.createdAt,
          paymentMethod: sale.paymentMethod,
          paymentIssue: true,
        })
        setCart([])
        setPhoneNumber('')
      }
      setOrderError(error.message || 'The sale could not be created. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8 text-black">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#22396F]">
            Cashier · New order
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Create an order
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
            Tap a menu item to add it to checkout. Adjust quantities before
            creating the order.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
          <Icon name="bag" className="size-5 text-[#22396F]" />
          <span>
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in order
          </span>
        </div>
      </header>

      <div
        role="note"
        className="rounded-xl border border-[#22396F]/15 bg-[#FCF1D0] px-4 py-3 text-sm leading-5 text-black/75"
      >
        Menu items are currently sample data. New sales are saved to the backend.
      </div>

      {latestOrder && (
        <section
          aria-live="polite"
          className="flex flex-col gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
              <Icon name="check" className="size-5" />
            </span>
            <div>
              <p className="font-bold text-black">
                {latestOrder.paymentIssue
                  ? 'Sale saved, but payment setup needs attention'
                  : 'Sale created'}
              </p>
              <p className="mt-1 text-sm text-black/65">
                {latestOrder.id} · {formatPrice(latestOrder.total)} ·{' '}
                {new Intl.DateTimeFormat('en-KE', {
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(latestOrder.createdAt))}
              </p>
              <p className="mt-1 text-sm text-black/65">
                {latestOrder.paymentMethod === 'mpesa'
                  ? 'Approve the M-Pesa prompt. The order will update after payment confirmation.'
                  : 'Sale saved. Collect cash from the Orders page to complete payment.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLatestOrder(null)}
            aria-label="Dismiss order confirmation"
            className="grid size-9 self-end place-items-center rounded-lg text-black/60 transition-colors hover:bg-emerald-700/10 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:self-auto"
          >
            <Icon name="close" className="size-4" />
          </button>
        </section>
      )}

      {orderError && (
        <p
          role="alert"
          className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
        >
          {orderError}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="menu-heading" className="min-w-0">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="menu-heading"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Menu
                </h2>
                <p className="mt-1 text-sm text-black/55">
                  {filteredItems.length}{' '}
                  {filteredItems.length === 1 ? 'item' : 'items'} available
                </p>
              </div>
              <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-black/15 bg-white px-3 transition-colors focus-within:border-[#22396F] sm:max-w-xs">
                <Icon name="search" className="size-5 shrink-0 text-black/45" />
                <span className="sr-only">Search menu</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search food or drinks"
                  className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/40"
                />
              </label>
            </div>

            <div
              aria-label="Filter menu by category"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                    activeCategory === category
                      ? 'bg-black text-white'
                      : 'border border-black/15 bg-white text-black/70 hover:border-black/35 hover:text-black'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  aria-label={`Add ${item.name}, ${formatPrice(item.price)}, to order`}
                  className="group flex min-h-36 w-full items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-16 shrink-0 place-items-center rounded-xl text-3xl ${item.color}`}
                  >
                    {item.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-bold leading-5">{item.name}</span>
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black text-white transition-colors group-hover:bg-[#22396F]">
                        <Icon name="plus" className="size-4" />
                      </span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-black/55">
                      {item.description}
                    </span>
                    <span className="mt-2 block text-sm font-bold text-[#22396F]">
                      {formatPrice(item.price)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white px-4 py-12 text-center">
              <p className="font-semibold">No menu items found</p>
              <p className="mt-1 text-sm text-black/55">
                Try another search or choose a different category.
              </p>
            </div>
          )}
        </section>

        <aside
          aria-labelledby="checkout-heading"
          className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm xl:sticky xl:top-5"
        >
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <div>
              <h2 id="checkout-heading" className="text-lg font-bold">
                Checkout
              </h2>
              <p className="mt-0.5 text-xs text-black/55">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-black text-white">
              <Icon name="bag" />
            </span>
          </div>

          {cart.length > 0 ? (
            <ul className="max-h-[min(50vh,28rem)] divide-y divide-black/10 overflow-y-auto px-5">
              {cart.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-black/55">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-black/10 p-1">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="grid size-8 place-items-center rounded-md transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-black"
                      >
                        <Icon name="minus" className="size-4" />
                      </button>
                      <span
                        aria-label={`Quantity ${item.quantity}`}
                        className="min-w-7 text-center text-sm font-semibold"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="grid size-8 place-items-center rounded-md transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-black"
                      >
                        <Icon name="plus" className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-black/55 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center px-5 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-[#E8EDF2] text-black/55">
                <Icon name="bag" />
              </span>
              <p className="mt-3 text-sm font-semibold">Your order is empty</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-black/55">
                Select food or drinks from the menu to add them to checkout.
              </p>
            </div>
          )}

          <div className="border-t border-black/10 bg-[#E8EDF2]/40 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black/65">Total</span>
              <span className="text-xl font-bold">{formatPrice(orderTotal)}</span>
            </div>
            <label className="mt-4 block text-sm font-semibold">
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 font-normal outline-none focus:border-[#22396F]"
              >
                <option value="cash">Cash (collect after creating)</option>
                <option value="mpesa">M-Pesa (send prompt now)</option>
              </select>
            </label>
            {paymentMethod === 'mpesa' && (
              <label className="mt-3 block text-sm font-semibold">
                M-Pesa phone number
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="07XXXXXXXX"
                  required
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 font-normal outline-none focus:border-[#22396F]"
                />
              </label>
            )}
            <button
              type="button"
              onClick={createOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#22396F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/45"
            >
              <Icon name="receipt" className="size-5" />
              {isSubmitting
                ? 'Creating sale…'
                : paymentMethod === 'mpesa'
                  ? 'Create sale & send M-Pesa prompt'
                  : 'Create sale'}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-black/50">
              {paymentMethod === 'mpesa'
                ? 'Payment remains pending until the backend confirms it.'
                : 'Cash payment can be recorded from the Orders page.'}
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Sale
