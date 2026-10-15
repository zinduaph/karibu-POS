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

The sale controller expects authentication middleware to populate
`req.userId.userId`, matching the existing controller convention. Protect
authenticated sale endpoints with the team's authentication middleware; the
M-Pesa callback endpoint must remain publicly reachable by Safaricom.
