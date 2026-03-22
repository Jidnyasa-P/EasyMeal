# EasyMeal — Cafeteria Ordering System

## Quick Start (Windows / VS Code)

### Step 1 — MySQL Setup (one time only)
Open MySQL Workbench or MySQL Shell and run:
```
mysql -u root -p < database/easymeal.sql
```
Edit `backend/.env` and set your MySQL password.

### Step 2 — Start Backend
Open **Terminal 1** in VS Code:
```
cd backend
npm install
npm start
```
You should see: `🚀 http://localhost:3000`

### Step 3 — Start Frontend
Open **Terminal 2** in VS Code:
```
cd frontend
npx serve .
```
Open the URL shown (usually http://localhost:3000 → use **http://localhost:5000** or the port shown).

> Alternative frontend server: `npx live-server` (auto-reloads on save)

---

## Login Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@easymeal.com     | admin123   |
| Student | aditi@student.com      | student123 |
| Student | rahul@student.com      | student123 |

---

## What Was Fixed (v3)

1. **Analytics "failed to load"** — `window.loadAnalytics` now defined at top of script.js (outside DOMReady), so it's always available when `showPanel('analytics')` is called.
2. **Order History failing** — `/api/orders/history` route correctly placed before `/:id` wildcard in Express.
3. **Reorder / For You buttons not adding to cart** — `window.addItemToCart` now defined at top-level (not inside a scoped block), guaranteed available everywhere.
4. **Email URL encoding** — Student order endpoints now use `?email=` query params instead of path params, eliminating double-encoding issues with `@` in emails.

---

## File Structure
```
EasyMeal-fixed/
├── frontend/
│   ├── index.html          ← Landing page
│   ├── login.html          ← Student + Admin login
│   ├── dashboard.html      ← Student menu + orders
│   ├── cart.html           ← Cart + coupon
│   ├── payment.html        ← Payment method
│   ├── confirmation.html   ← Order confirmation
│   ├── admin.html          ← Admin dashboard
│   ├── css/styles.css
│   └── js/
│       ├── api.js          ← API URLs config
│       └── script.js       ← All page logic
├── backend/
│   ├── server.js           ← Express API
│   ├── db.js               ← MySQL pool
│   ├── .env                ← DB credentials
│   └── package.json
└── database/
    └── easymeal.sql        ← Schema + seed data
```
