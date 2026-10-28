# React + Vite

## Admin authentication

The admin app uses the auth API's `/api/auth/admin/register`, `/api/auth/admin/login`,
`/api/auth/refresh`, and `/api/auth/logout` endpoints. Admin passwords must be at
least 12 characters. Registration creates the restaurant and its first admin account.

For local development, start the auth API on port 5000 and the admin app on port
5173. Vite proxies `/api` to the local API by default. To use a separately hosted API,
set `VITE_BACKEND_URL` to its origin (for example, `https://api.example.com`).
The API must allow the admin app's exact origin through `ADMIN_ORIGIN` (or
comma-separated `ADMIN_ORIGINS`) so credentialed refresh-cookie requests can succeed.
For a frontend and API hosted on different sites, configure the API cookie's
`COOKIE_SAMESITE=none` and serve both over HTTPS.

The Ingredients page uses `GET /api/inventory/ingredients` to list the current
restaurant's ingredients and `POST /api/inventory/add-ingredients` to create
up to 100 at a time. The API derives restaurant ownership from the authenticated
access token.

The Menu items page uses `POST /api/menu-items` to add an item for the
authenticated admin's restaurant. Each item includes a name, category, numeric
price, and availability/inventory tracking options. The API derives restaurant
ownership from the access token.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
