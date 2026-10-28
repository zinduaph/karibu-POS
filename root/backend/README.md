# Backend and M-Pesa setup

Run `npm run dev` from the `root/backend` directory during development to
restart the server automatically when backend files change. `npm start` runs
the server with Node directly and does not watch for changes.

M-Pesa sales use Safaricom Daraja STK Push. Add these values to the backend
environment (never commit real credentials):

```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://your-public-host/api/sales/mpesa/callback
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
```

Set `MPESA_ENV=production` only with production Daraja credentials and a public
HTTPS callback URL. Use `CustomerBuyGoodsOnline` for a Till-number setup if
that is what Safaricom has enabled for your account.

`POST /api/sales` accepts either a single `productName`/`price`/`quantity` or
an `items` array with `name`, `price`, `quantity`, and optional `category`.
The server calculates the total and creates a pending sale. Cash sales can be
completed with `POST /api/sales/cash-payment`, using `orderId` and
`amountReceived`. M-Pesa requests also require `phoneNumber` in Kenyan format;
the server sends the STK Push and keeps the sale pending until the Daraja
callback confirms its amount, phone number, and receipt.

The client uses `/api/sales` for checkout, order history, cash collection, and
the dashboard summary. During development Vite proxies `/api` to the backend
on port 8000.

`POST /api/menu-items` adds a menu item for the authenticated admin's
restaurant. Authenticate with an access token in the Authorization header and
send a JSON body with `name`, `category`, and numeric `price`. Optional fields
are `recipe` (an array of
`{ "ingredientId": "...", "quantity": 1 }`), `trackInventory`, and
`isAvailable`. Recipe ingredients must be active and belong to the same
restaurant; ownership is taken from the access token, not the request body.

`GET /api/inventory` returns the authenticated user's inventory balances.
Admins can set or initialize a balance with `PUT /api/inventory` and a JSON
body containing `ingredientId`, `quantity`, and optional
`averageCostPerBaseUnit`. This sets the absolute stock quantity; it does not
add the submitted quantity to the existing balance.

Admins can list ingredients with `GET /api/inventory/ingredients` and create
one or more with `POST /api/inventory/add-ingredients`. Each ingredient needs
`name` and a `baseUnit` of `g`, `ml`, or `piece`; `lowStockThreshold` is optional
and defaults to zero. Restaurant ownership is taken from the access token.

Admin and cashier authentication routes are available under `/api/auth`; the
legacy `/api/user` prefix remains as an alias. Refresh tokens use an HTTP-only
cookie, so the API allows credentialed requests from `CLIENT_ORIGIN` or the
comma-separated `CLIENT_ORIGINS` list (default `http://localhost:5173`).
Authenticated product and sales routes use the access token in the
Authorization header; the M-Pesa callback remains public for Safaricom.

Admins create cashier accounts with `POST /api/auth/cashier/register`, sending
`name`, `username`, and a six-digit temporary `pin` with their access token in
the Authorization header. The server assigns the cashier to the admin's
restaurant, rejects weak or duplicate credentials, hashes the PIN, and returns
the restaurant code for cashier sign-in. Cashiers must change their temporary
PIN after their first login.
