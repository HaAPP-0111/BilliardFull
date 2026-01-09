# Admin Frontend (Vite + React + MUI)

This is a scaffolded admin frontend for the Billiard Hall management app.

Features included in scaffold:
- React + Vite setup
- Material UI for UI components
- Axios instance with JWT interceptor
- Login page calling `/api/auth/login`
- Protected route wrapper
- Simple Tables list page that calls `/api/tables`
- Vite dev proxy to forward `/api` to backend at `http://localhost:8080`

Quick start
1. Install dependencies

```powershell
cd admin-frontend
npm install
```

2. Run dev server

```powershell
npm run dev
```

3. Open in browser

http://localhost:3000

Notes
- The scaffold expects the backend to run at `http://localhost:8080` (the vite proxy forwards `/api` requests).
- Login requests are sent to `/api/auth/login` and the returned `token` is stored in `localStorage`.
- After login, the app navigates to the admin pages and axios will attach the token automatically.

Next steps I can implement for you:
- CRUD dialogs for Tables (create/edit/delete)
- Pages for Products, Invoices, Employees
- Dashboard and Reports with charts
- Better error handling and form validation
- Styling and polish

If you want me to create the CRUD UI for Tables next, tell me and I'll implement create/edit/delete flows and dialogs.
