# 🧺 BIG BASKET — Full-Stack Grocery E-Commerce Platform

> **Production-Ready Master Web Application & Client Handover Documentation**

**BIG BASKET** (*Fresh Groceries & Daily Essentials*) is a high-performance, full-stack grocery e-commerce platform built with modern web architecture: **React 18 + TypeScript + Vite + Tailwind CSS** on the frontend, and **Node.js + Express + TypeScript + Prisma ORM** on the backend.

---

## 🌟 Key Highlights & Architecture

- **⚡ Fast & Modern**: Sub-second catalog browsing, debounced live search autocomplete, category filters, and instant cart updates.
- **🛡️ Secure & Robust**: JWT authentication, bcrypt password hashing, input validation via Zod schemas, rate-limiting, CORS, and Helmet security headers.
- **📱 Smart Unified Login**: Single login portal for both Customers and Store Administrators with 6-digit OTP verification and automatic role-based redirection.
- **🛒 Complete Grocery Flow**: 13 master grocery categories, coupon discount engine (`WELCOME20`, `FREEDEL`, `BIGBASKET50`, `FLAT100`), delivery slot scheduler (Today / Tomorrow), free delivery progress bar, and atomic database transaction order placement.
- **💳 Native Payments**: Cash on Delivery (COD) works 100% out of the box with zero external configuration + ready-to-plug Razorpay online payment integration with HMAC-SHA256 signature verification.
- **📊 Real-Time Admin Dashboard**: Executive sales analytics, 7-day revenue bar chart, live inventory stock adjustments, order dispatch pipeline, review moderation, banner carousel management, and store settings.

---

## 📁 Repository Structure

```text
bigbasket/
├── client/                     # Frontend Application (React 18 + TypeScript + Vite)
│   ├── public/                 # Static assets (logo, product illustrations, banners)
│   ├── src/
│   │   ├── api/                # Axios API client instance with interceptors
│   │   ├── components/         # Reusable UI components (Navbar, Footer, ProductCard, etc.)
│   │   ├── context/            # Global state (AuthContext, CartContext, WishlistContext)
│   │   ├── pages/
│   │   │   ├── customer/       # Storefront pages (Home, Shop, ProductDetail, Cart, Checkout, etc.)
│   │   │   └── admin/          # Admin Portal pages (Dashboard, Products, Inventory, Orders, etc.)
│   │   ├── types/              # Full TypeScript interface definitions
│   │   ├── App.tsx             # Main client router & protected guards
│   │   ├── index.css           # Custom design tokens & styling utilities
│   │   └── main.tsx            # React application entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Backend API Service (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment & Prisma client instances
│   │   ├── controllers/        # Express route controllers (Auth, Products, Cart, Orders, Admin, etc.)
│   │   ├── middleware/         # Auth guards, role verification, file upload, error handling
│   │   ├── routes/             # RESTful API route definitions (/api/*)
│   │   ├── utils/              # JWT, response helpers, OTP generator
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # Server entrypoint (Port 5000)
│   ├── test/                   # Automated integration test suite
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                     # Database Schema & Migrations
│   ├── schema.prisma           # Prisma models (User, Product, Category, Order, Cart, etc.)
│   └── seed.ts                 # Database seeder with 25+ products & sample users
│
├── assets/                     # Master brand media assets (Official logo, banners, icons)
├── uploads/                    # User & Admin media upload directory
├── .env.example                # Template environment variables
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **NPM**: `v9.0.0` or higher

---

### 1. Clone & Install Dependencies

Run the unified installer from the project root:

```bash
npm run install:all
```

*(This installs root, server, and client dependencies in one command).*

---

### 2. Environment Configuration

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
cp .env.example .env
```

Default development settings in `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
JWT_SECRET=super_secret_jwt_key_bigbasket_grocery_2026_dev_mode
ADMIN_EMAIL=admin@bigbasket.local
ADMIN_PASSWORD=admin123
```

---

### 3. Initialize Database & Seed Data

Initialize SQLite database and seed products, categories, coupons, delivery slots, and demo accounts:

```bash
npm run db:setup
```

*Or run individually:*

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

---

### 4. Start Development Servers

Start both Backend API (`:5000`) and Frontend Client (`:5173`) concurrently:

```bash
npm run dev
```

- **🛍️ Storefront Application**: [http://localhost:5173](http://localhost:5173)
- **⚡ Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
- **🩺 API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Test Accounts

| Account | Mobile / Email | Verification OTP | Password | Default Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Store Customer** | `9876500001` or `customer@bigbasket.local` | `123456` | `customer123` | **Customer Storefront** (`/`) |
| **Store Administrator** | `9876543210` or `admin@bigbasket.local` | `123456` | `admin123` | **Admin Dashboard** (`/admin`) |

---

## 🧪 Testing & Verification

Run the comprehensive 20-point backend automated integration test suite:

```bash
npm test
```

*Validates: Health check, Registration, Login, Admin RBAC, Product catalog, Search suggestions, Cart operations, Wishlist, Coupon validation, Delivery slots, Atomic checkout, Order cancellation with stock restore, and Security guards.*

---

## 🏗️ Production Build & Deployment

To generate optimized production bundles:

```bash
npm run build
```

This compiles:

- `server/dist`: Compiled Node.js CommonJS JavaScript.
- `client/dist`: Minified, tree-shaken static assets with gzip compression.

To run the production backend service:

```bash
npm start
```

---

## 💳 Payment Gateway Configuration (Optional)

Cash on Delivery (COD) is natively enabled. To enable online payments via Razorpay:

1. Obtain test API keys from [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Add your keys to `.env`:

   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
   RAZORPAY_KEY_SECRET=YourKeySecretHere
   ```

3. Restart server. The system automatically enables Razorpay online checkout modal with HMAC signature verification.

---

## 📄 License & Attribution

All custom brand logos and store designs are proprietary to **BIG BASKET**. All rights reserved.
