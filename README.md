# BIG BASKET — Online Grocery Supermarket & Delivery Platform

> **Step 1: Frontend Foundation + Homepage**

Big Basket is a modern, high-performance online grocery and daily essentials e-commerce platform. It provides quick-commerce functionality inspired by leading grocery marketplaces with fresh branding, layout, CSS design system, and modular JavaScript.

---

## 🚀 Tech Stack

- **HTML5**: Semantic, accessible markup.
- **CSS3**: Vanilla CSS with comprehensive CSS custom properties (Design Tokens), flexbox, grid, and fluid responsive design. No Tailwind, no Bootstrap.
- **Vanilla JavaScript**: Clean, modular ES6+ architecture with an API abstraction layer (`/js/api.js`) ready to connect to a Python FastAPI backend.
- **Zero Heavy Frameworks**: Ultra-lightweight, zero bundle overhead, sub-second load times.

---

## 📁 Project Structure

```text
bigbasket/
│
├── index.html               # Main Homepage (21 completed sections)
├── shop.html                # Shop & Category Catalog Page (Placeholder)
├── product.html             # Product Details Page (Placeholder)
├── cart.html                # Full Cart Page (Placeholder)
├── checkout.html            # Checkout Flow Page (Placeholder)
├── login.html               # Customer Login Page (Placeholder)
├── register.html            # Registration Page (Placeholder)
│
├── css/
│   ├── variables.css        # Design system tokens (colors, spacing, typography, shadows)
│   ├── reset.css            # Modern clean CSS reset
│   ├── global.css           # Utility classes, buttons, badges, modals, toast system
│   ├── header.css           # Topbar, sticky header, search dropdown, category pills
│   ├── hero.css             # Hero promotional banner with animated visual stack
│   ├── categories.css       # 14 categories grid with themed badges and hover effects
│   ├── products.css         # Reusable product cards with quantity stepper & MRP discount
│   ├── sections.css         # Best Deals, Why Choose Us, Local Delivery, Newsletter
│   ├── footer.css           # 4-column footer, social icons, app store teasers, payment pills
│   └── responsive.css       # Mobile-first responsive breakpoints (320px to 1920px+)
│
├── js/
│   ├── api.js               # API abstraction layer with realistic Indian grocery mock data
│   ├── app.js               # Main bootstrap & orchestrator
│   ├── header.js            # Sticky scroll effect and mobile drawer menu toggle
│   ├── search.js            # Live autocomplete suggestions, history & popular tags
│   ├── location.js          # Deliver-to modal, pincode validation, area selector
│   ├── products.js          # Product rendering & horizontal carousel scroll controls
│   ├── cart.js              # Reactive cart state (localStorage), badge counter, slide-over drawer
│   └── ui.js                # Toast notification system and UI micro-interactions
│
├── assets/
│   ├── icons/               # SVG icon sprites
│   ├── logo/                # Big Basket brand logo
│   └── images/              # Media directory
│
└── README.md                # Project documentation & execution guide
```

---

## ✨ Features Implemented in Step 1

1. **Top Announcement Bar**: Informative delivery speed, freshness, and payment highlights.
2. **Desktop & Mobile Header**:
   - Left: Big Basket logo.
   - Center: Intelligent search bar with clear button, live search suggestions, recent searches (with clear option), and popular search tags.
   - Right: Deliver-To location picker, customer account link, and interactive Cart button with badge counter and real-time subtotal.
   - Mobile: 3-row layout (Row 1: Menu + Logo + Cart; Row 2: Search; Row 3: Deliver to address strip).
3. **Location Selector Modal**:
   - Select popular local areas (Indiranagar, Koramangala, Bandra, Connaught Place, Hitec City, etc.).
   - 6-digit Indian pincode input with validation.
   - "Use Current Location" simulated trigger.
   - Persists selected delivery address across the site.
4. **Search Experience**:
   - Debounced search queries.
   - Live dropdown matching product name, brand, or category.
   - Recent search history saved to `localStorage`.
   - Keyboard accessible (Enter, Escape).
5. **Hero Banner**:
   - High-impact visual with *"Everything You Need, Delivered Fast."*
   - Pulse animation on express delivery badge.
   - Showcase basket card and promotional coupon code `BBFIRST`.
6. **Shop by Category (14 Categories)**:
   - Fruits & Veg, Atta/Rice/Dal, Dairy, Snacks, Chocolates, Beverages, Personal Care, Household, Baby Care, Toys & Kids, Beauty, Home & Kitchen, Electronics, Pet Care.
   - Individual color themes, hover lifts, and direct links to category catalog (`shop.html?category=...`).
7. **Reusable Product Card System**:
   - Product image/artwork with category badge.
   - Brand name, product title, unit/weight.
   - Star rating pill (e.g., `★ 4.8`).
   - Selling price vs MRP with discount percentage.
   - Interactive **ADD** button that transforms into a `[ - QTY + ]` quantity stepper.
8. **Horizontal Product Carousels**:
   - Best Sellers, Fresh Grocery Picks, Snacks & Chocolates, Toys & Kids, Household Essentials.
   - Smooth left/right navigation arrow buttons on desktop with auto-disable at boundaries.
   - Native touch swipe scroll on mobile devices.
9. **Promotional Deals & Offers**:
   - 4 vibrant promo cards (Mega Fresh Sale, Value Saver, Chocolates Fest, Kids Carnival).
10. **Why Choose Us**:
    - 4 value props (Fast Local Delivery, Fresh Products, Secure Payments, Friendly Support).
11. **Local Delivery Explainer**:
    - Hyperlocal supermarket online showcase with verified delivery hubs.
12. **Newsletter & VIP Discounts**:
    - Email subscription form with dynamic toast notification feedback.
13. **Professional Multi-Column Footer**:
    - About, Shop, Help, Legal columns, social media links, app store download teasers, and accepted payment method badges (UPI, Cards, COD).
14. **Slide-Over Cart Drawer**:
    - Accessible from any page via the header cart button.
    - Free delivery progress meter (`Add ₹... more for FREE delivery`).
    - Increment/decrement item quantity or remove item.
    - Real-time item total, discount savings, delivery fee, and checkout CTA.

---

## 💻 How to Run Locally

You can run this frontend with any static HTTP server. Examples:

### Option 1: Python Built-in Server (Recommended)

```bash
# In the project directory:
python -m http.server 8000
```

Then open `http://localhost:8000` in your web browser.

### Option 2: Node / NPX Serve

```bash
npx -y serve .
```

### Option 3: VS Code Live Server Extension

Right-click `index.html` and select **"Open with Live Server"**.

---

## 🔮 Next Step (Step 2 Roadmap)

- **FastAPI Backend**: Connect `/js/api.js` endpoints to a Python FastAPI service (`/api/v1/products`, `/api/v1/categories`, `/api/v1/search`, `/api/v1/orders`).
- **Database**: PostgreSQL / SQLite schema for products, inventory, users, addresses, and orders.
- **Authentication**: JWT token authentication with OTP verification.
- **Payment Gateway**: Integration of Razorpay / UPI QR code generation.
- **Order Management & Tracking**: Real-time delivery tracking for local orders.
