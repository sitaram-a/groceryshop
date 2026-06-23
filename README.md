# 🛒 GroceryShop — Full Stack Online Grocery App

**Stack:** React 18 · Node.js / Express · MySQL 8 · Razorpay · Nodemailer

---

## Quick Start (Localhost)

### 1. Database
```bash
mysql -u root -p
source server/config/schema.sql
```

### 2. Server
```bash
cd server
npm install
# Edit .env with your credentials (see below)
npm run dev        # → http://localhost:5000
```

### 3. Client
```bash
cd client
npm install
# Edit .env with your Razorpay test key
npm run dev        # → http://localhost:5173
```

---

## Default Admin Login
- **Email:** admin@groceryshop.com
- **Password:** Admin@123

---

## Environment Variables

### server/.env
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=groceryshop

JWT_SECRET=any_random_string_here
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASS=xxxx xxxx xxxx xxxx

EMAIL_FROM=noreply@groceryshop.com
EMAIL_FROM_NAME=GroceryShop

CLIENT_URL=http://localhost:5173
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

---

## Project Routes

### Customer
| Route | Page |
|-------|------|
| `/` | Home — hero, categories, featured |
| `/shop` | Shop — filter, search, sort, paginate |
| `/product/:id` | Product detail |
| `/cart` | Cart with qty controls |
| `/checkout` | Checkout + Razorpay / COD |
| `/order-success/:id` | Order confirmation |
| `/orders` | Order history |
| `/login` | Login |
| `/register` | Register |

### Admin
| Route | Page |
|-------|------|
| `/admin` | Dashboard — stats, recent orders, top products |
| `/admin/products` | Products CRUD + image upload |
| `/admin/categories` | Categories CRUD + image upload |
| `/admin/orders` | Orders list, expand items, update status |
| `/admin/users` | Users list, block/unblock |

---

## Razorpay Test Cards
| Type | Number | CVV | Expiry |
|------|--------|-----|--------|
| Visa Success | 4111 1111 1111 1111 | Any | Any future |
| UPI Success | success@razorpay | — | — |
| Failure | 4000 0000 0000 0002 | Any | Any future |

---

## Payment Flow
```
Checkout → POST /api/orders/place
         → POST /api/payment/create-order  (Razorpay order ID)
         → Razorpay modal opens
         → User pays
         → POST /api/payment/verify  (HMAC-SHA256 check)
         → DB: order marked paid + confirmed
         → Email sent to customer
         → Redirect /order-success/:id
```

---

## Free Delivery Rule
- Cart ≥ ₹500 → FREE delivery
- Cart < ₹500 → ₹40 delivery charge

---

## Phases Completed
| Phase | Features |
|-------|---------|
| ✅ Phase 1 | DB schema, Express server, JWT Auth (register/login) |
| ✅ Phase 2 | Categories API, Products API, Shop page, Cart API |
| ✅ Phase 3 | Cart page, Checkout, Razorpay + COD, Orders, Email |
| ✅ Phase 4 | Admin Dashboard, Products, Categories, Orders, Users |

---

## Live Deployment (cPanel)
1. `cd client && npm run build` → upload `dist/` to `public_html/`
2. Add `.htaccess` to `public_html/` for React Router SPA:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```
3. Upload `server/` folder to cPanel
4. Set up Node.js App in cPanel → point to `server.js`
5. Add all `.env` variables in cPanel Node.js app environment
6. Switch `rzp_test_` → `rzp_live_` keys
7. Switch email from Gmail SMTP → Brevo API (cPanel blocks port 587)
8. Update `CLIENT_URL` to your domain

---

*GroceryShop v1.0 — Phases 1–4 Complete*
