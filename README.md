# 🍽️ EasyMeal - Smart Cafeteria & Mess Management System

A full-stack web application with Node.js backend, MySQL database, and HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
EasyMeal/
├── frontend/          ← All HTML pages + CSS + JS
│   ├── index.html     ← Landing page
│   ├── login.html     ← Login & Register
│   ├── dashboard.html ← Student menu & order dashboard
│   ├── cart.html      ← Cart management
│   ├── payment.html   ← Payment selection (saves order to DB)
│   ├── confirmation.html ← Order confirmation & tracking
│   ├── admin.html     ← Admin dashboard (CRUD menu + orders)
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js     ← API URL config & helpers
│       └── script.js  ← All frontend logic
│
├── backend/           ← Node.js + Express API
│   ├── server.js      ← Main server with all routes
│   ├── db.js          ← MySQL connection pool
│   ├── package.json
│   └── .env           ← ⚠️ Edit this with your MySQL credentials
│
└── database/
    └── easymeal.sql   ← MySQL schema + 5 dummy records
```

---

## ⚙️ Setup Instructions

### Step 1 — Setup MySQL Database

1. Open MySQL Workbench or terminal
2. Run the SQL file:

```bash
mysql -u root -p < database/easymeal.sql
```

Or paste the contents of `database/easymeal.sql` into MySQL Workbench and execute.

This creates the `easymeal_db` database with:
- 5 users (1 admin + 4 students)
- 6 menu items
- 5 sample orders with items

---

### Step 2 — Configure Backend

1. Open `backend/.env` and update your MySQL password:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password   ← Change this!
DB_NAME=easymeal_db
DB_PORT=3306
PORT=3000
```

---

### Step 3 — Install & Run Backend

```bash
cd backend
npm install
npm start
```

You should see:
```
✅ Connected to MySQL database: easymeal_db
🚀 Server running at: http://localhost:3000
📡 API base URL:      http://localhost:3000/api
```

---

### Step 4 — Open Frontend

Open `frontend/index.html` in your browser. 

**Recommended:** Use VS Code Live Server extension for best results:
- Right-click `frontend/index.html` → "Open with Live Server"
- It runs at `http://127.0.0.1:5500`

Or simply double-click `frontend/index.html` to open in browser.

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@easymeal.com     | admin123   |
| Student | aditi@student.com      | student123 |
| Student | rahul@student.com      | student123 |
| Student | neha@student.com       | student123 |
| Student | arjun@student.com      | student123 |

---

## 🌐 API Endpoints

| Method | URL                        | Description              |
|--------|----------------------------|--------------------------|
| GET    | /api/health                | Server health check      |
| POST   | /api/auth/login            | Login (student/admin)    |
| POST   | /api/auth/register         | Register new student     |
| GET    | /api/menu                  | Get available menu items |
| POST   | /api/menu                  | Add menu item (admin)    |
| PUT    | /api/menu/:id              | Update menu item (admin) |
| DELETE | /api/menu/:id              | Delete menu item (admin) |
| GET    | /api/orders                | Get all orders (admin)   |
| POST   | /api/orders                | Place new order          |
| GET    | /api/orders/:id            | Get single order         |
| GET    | /api/orders/student/:email | Get student's orders     |
| PUT    | /api/orders/:id/status     | Update order status      |
| GET    | /api/admin/stats           | Dashboard statistics     |

---

## 🔄 How Data Flows

1. **Register/Login** → Authenticated via MySQL `users` table → Session stored in `sessionStorage`
2. **Browse Menu** → Fetched live from MySQL `menu_items` table
3. **Add to Cart** → Stored in browser `localStorage`
4. **Place Order** → Sent to backend → Saved in MySQL `orders` + `order_items` tables
5. **Admin Dashboard** → Reads stats/orders/menu from MySQL → Can update order status live

---

## 🛠️ Technologies Used

- **Frontend:** HTML5, CSS3, Bootstrap 5.3, jQuery 3.7
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8+
- **ORM/Driver:** mysql2 (with promise support)
- **Other:** dotenv, cors, nodemon (dev)
