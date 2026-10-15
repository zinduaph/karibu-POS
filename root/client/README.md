# Karibu POS client

Start the backend from `root/backend` with `npm run dev`, then start this
client from `root/client` with `npm run dev`. The client sends API requests
directly to `VITE_BACKEND_URL` (default: `http://localhost:8000`) and appends
`/api`.

Sales and order management use the backend API. Set `VITE_BACKEND_URL` when
the backend is hosted at a different URL (for example,
`https://example.com`). The client sends a bearer token from local storage
using the key `token`; set `VITE_AUTH_TOKEN_KEY` if the authentication
implementation uses a different key.

The Sale screen currently uses sample menu data. Product management is not
connected to the product API yet.
