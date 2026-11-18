# Karibu POS client

Start the backend from the repository root with `npm run dev`, then start the
cashier client from `root/client` with `npm run dev` and the admin app from
`root/admin` with `npm run dev`. The cashier client runs on port `5173` and
the admin app on port `5174` by default. The API listens on port `5000` by
default, and both frontends use `VITE_BACKEND_URL` (default:
`http://localhost:5000`) and append `/api`.

The API allows the local frontend origins on ports `5173` and `5174` by
default. Set the backend's `CORS_ORIGINS` environment variable to a
comma-separated list of frontend origins when deploying from other domains.

Cashiers sign in at `/login` with their restaurant code, username, and PIN.
They use the PIN created for them by an admin. Admins sign in at
`/login` in the admin app; the home page and admin registration page link to
the appropriate sign-in page.

Sales and order management use the backend API. Set `VITE_BACKEND_URL` when
the backend is hosted at a different URL (for example,
`https://example.com`). The client sends a bearer token from local storage
using the key `token`; set `VITE_AUTH_TOKEN_KEY` if the authentication
implementation uses a different key.

The Sale screen currently uses sample menu data. Product management is not
connected to the product API yet.
