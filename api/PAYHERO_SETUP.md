# PayHero M-Pesa billing setup

This integration uses PayHero's M-Pesa STK Push endpoint. It does not include card checkout.

Configure these values in the repository-root `.env`:

```env
PAYHERO_BASIC_AUTH_TOKEN=
PAYHERO_CHANNEL_ID=
PAYHERO_CALLBACK_URL=https://api.example.com/api/billing/webhook
```

Use the Basic Authorization token from PayHero, or set both `PAYHERO_API_USERNAME` and `PAYHERO_API_PASSWORD` instead. `PAYHERO_CHANNEL_ID` is the numeric ID under **Payment Channels → My Payment Channels**; it is not the PayHero account ID. The callback URL must be publicly reachable over HTTPS in production.

The server verifies callback transactions with PayHero's transaction-status API before marking an invoice paid. The PayHero callback endpoint therefore must remain public, while checkout and invoice-status endpoints require an authenticated admin.

Before deploying, run this once against the configured MongoDB database:

```powershell
node api\migrateInvoiceDueIndex.js
node api\migratePayheroIndexes.js
```

The first script replaces the old TTL index on invoice due dates with a normal lookup index so invoice history is not automatically deleted. The second checks for conflicting pending payments or duplicate invoice subscriptions, then creates the indexes needed to prevent duplicate charges and subscription records. Resolve any reported conflicts before deploying. Neither script deletes invoice or payment documents.

Official API references:

- [PayHero authorization](https://docs.payhero.co.ke/docs/authorization)
- [Initiate M-Pesa STK Push](https://docs.payhero.co.ke/docs/post-initiate-mpesa-stk-push-request)
- [Payment callback](https://docs.payhero.co.ke/docs/payment-callback)
- [Get transaction status](https://docs.payhero.co.ke/docs/get-transaction-status)
