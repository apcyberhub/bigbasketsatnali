import fs from 'fs';
import path from 'path';

// Color themes & grocery illustrations per product
const productVisuals: { [slug: string]: { bg: string; accent: string; icon: string; title: string; subtitle: string } } = {
  'fresh-farm-onions-1kg': { bg: '#fdf2f8', accent: '#db2777', icon: '🧅', title: 'Farm Fresh', subtitle: 'Pink Onions (Pyaz)' },
  'fresh-hybrid-tomatoes-1kg': { bg: '#fef2f2', accent: '#dc2626', icon: '🍅', title: 'Farm Fresh', subtitle: 'Hybrid Tomatoes' },
  'fresh-potatoes-1kg': { bg: '#fefce8', accent: '#ca8a04', icon: '🥔', title: 'Farm Fresh', subtitle: 'Fresh Potatoes (Aloo)' },
  'shimla-apple-royal-delicious-1kg': { bg: '#fff1f2', accent: '#e11d48', icon: '🍎', title: 'Nature Choice', subtitle: 'Shimla Royal Apple' },
  'robusta-bananas-1kg': { bg: '#fefce8', accent: '#eab308', icon: '🍌', title: 'Nature Choice', subtitle: 'Robusta Bananas' },
  'fresh-coriander-leaves-100g': { bg: '#f0fdf4', accent: '#16a34a', icon: '🌿', title: 'Farm Fresh', subtitle: 'Fresh Dhaniya' },
  'amul-taaza-toned-milk-1l': { bg: '#eff6ff', accent: '#2563eb', icon: '🥛', title: 'Amul Taaza', subtitle: 'Homogenised Toned Milk' },
  'amul-salted-butter-500g': { bg: '#fefce8', accent: '#d97706', icon: '🧈', title: 'Amul Butter', subtitle: 'Pasteurised Butter 500g' },
  'amul-fresh-malai-paneer-200g': { bg: '#f8fafc', accent: '#0284c7', icon: '🧀', title: 'Amul Malai', subtitle: 'Fresh Paneer 200g' },
  'britannia-100-percent-whole-wheat-bread-400g': { bg: '#fffbeb', accent: '#b45309', icon: '🍞', title: 'Britannia', subtitle: '100% Whole Wheat Bread' },
  'farm-fresh-white-eggs-6pcs': { bg: '#f8fafc', accent: '#475569', icon: '🥚', title: 'EggZone', subtitle: 'Fresh Farm Eggs (6 pcs)' },
  'aashirvaad-sharbati-atta-5kg': { bg: '#fffbeb', accent: '#d97706', icon: '🌾', title: 'Aashirvaad', subtitle: 'MP Sharbati Atta 5kg' },
  'fortune-biryani-special-basmati-rice-5kg': { bg: '#f0fdf4', accent: '#059669', icon: '🍚', title: 'Fortune Biryani', subtitle: 'Basmati Rice (Aged)' },
  'tata-sampann-unpolished-toor-dal-1kg': { bg: '#fff7ed', accent: '#ea580c', icon: '🥣', title: 'Tata Sampann', subtitle: 'Unpolished Toor Dal' },
  'fortune-sunlite-sunflower-oil-1l': { bg: '#fefce8', accent: '#ca8a04', icon: '🌻', title: 'Fortune Sunlite', subtitle: 'Refined Sunflower Oil' },
  'amul-pure-desi-ghee-1l-tin': { bg: '#fef3c7', accent: '#b45309', icon: '🫙', title: 'Amul Desi Ghee', subtitle: 'Pure Cow Ghee (Tin)' },
  'everest-turmeric-powder-500g': { bg: '#fefce8', accent: '#eab308', icon: '✨', title: 'Everest Haldi', subtitle: 'Pure Turmeric Powder' },
  'mdh-deggi-mirch-100g': { bg: '#fef2f2', accent: '#dc2626', icon: '🌶️', title: 'MDH Deggi Mirch', subtitle: 'Natural Red Chilli' },
  'tata-tea-gold-premium-500g': { bg: '#fef3c7', accent: '#92400e', icon: '☕', title: 'Tata Tea Gold', subtitle: 'Premium Black Tea' },
  'nescafe-classic-instant-coffee-100g-jar': { bg: '#fff7ed', accent: '#7c2d12', icon: '☕', title: 'Nescafe Classic', subtitle: 'Instant Coffee Jar' },
  'haldiram-aloo-bhujia-400g': { bg: '#fefce8', accent: '#d97706', icon: '🥨', title: 'Haldiram', subtitle: 'Nagpur Aloo Bhujia' },
  'maggi-2-minute-masala-noodles-12pack': { bg: '#fef2f2', accent: '#b91c1c', icon: '🍜', title: 'Maggi 2-Minute', subtitle: 'Masala Noodles (Pack of 12)' },
  'dettol-original-soap-4x125g': { bg: '#f0fdf4', accent: '#15803d', icon: '🧼', title: 'Dettol Original', subtitle: 'Germ Protection (Pack of 4)' },
  'surf-excel-quick-wash-detergent-2kg': { bg: '#eff6ff', accent: '#1d4ed8', icon: '🫧', title: 'Surf Excel', subtitle: 'Quick Wash Detergent 2kg' },
  'pampers-baby-pants-large-64pcs': { bg: '#f0fdfa', accent: '#0d9488', icon: '👶', title: 'Pampers Pants', subtitle: 'All Round Protection (64 pcs)' },
};

const categoryVisuals: { [slug: string]: { bg: string; icon: string; title: string } } = {
  'fruits-vegetables': { bg: '#ecfdf5', icon: '🥦', title: 'Fruits & Veggies' },
  'dairy-bakery': { bg: '#eff6ff', icon: '🥛', title: 'Dairy & Bakery' },
  'atta-rice-dal': { bg: '#fffbeb', icon: '🌾', title: 'Atta, Rice & Dal' },
  'oil-ghee': { bg: '#fefce8', icon: '🫒', title: 'Oil & Ghee' },
  'masalas-spices': { bg: '#fef2f2', icon: '🌶️', title: 'Masalas & Spices' },
  'beverages': { bg: '#fff7ed', icon: '🧃', title: 'Beverages' },
  'snacks-munchies': { bg: '#fefce8', icon: '🍿', title: 'Snacks & Namkeen' },
  'biscuits-cookies': { bg: '#fffbeb', icon: '🍪', title: 'Biscuits & Bakery' },
  'instant-frozen-food': { bg: '#fef2f2', icon: '🍜', title: 'Instant Foods' },
  'personal-care': { bg: '#fdf2f8', icon: '🧴', title: 'Personal Care' },
  'household-cleaning': { bg: '#eff6ff', icon: '🧼', title: 'Cleaning & Home' },
  'baby-care': { bg: '#f0fdfa', icon: '👶', title: 'Baby Care' },
  'pooja-essentials': { bg: '#fff7ed', icon: '🪔', title: 'Pooja Essentials' },
};

function generateProductSvg(vis: { bg: string; accent: string; icon: string; title: string; subtitle: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <radialGradient id="grad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${vis.bg}"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="500" height="500" rx="32" fill="url(#grad)" stroke="#f1f5f9" stroke-width="4"/>
  <circle cx="250" cy="210" r="140" fill="${vis.accent}" fill-opacity="0.10" />
  <circle cx="250" cy="210" r="115" fill="#ffffff" filter="url(#shadow)"/>
  <text x="250" y="245" font-size="96" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${vis.icon}</text>
  <rect x="50" y="370" width="400" height="90" rx="20" fill="#ffffff" filter="url(#shadow)"/>
  <text x="250" y="405" font-size="20" font-weight="bold" fill="${vis.accent}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1">${vis.title.toUpperCase()}</text>
  <text x="250" y="435" font-size="16" font-weight="600" fill="#334155" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${vis.subtitle}</text>
</svg>`;
}

function generateCategorySvg(vis: { bg: string; icon: string; title: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="catGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${vis.bg}"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#catGrad)" stroke="#e2e8f0" stroke-width="3"/>
  <circle cx="150" cy="130" r="75" fill="#ffffff" stroke="#f1f5f9" stroke-width="2"/>
  <text x="150" y="155" font-size="64" text-anchor="middle">${vis.icon}</text>
  <text x="150" y="245" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${vis.title}</text>
</svg>`;
}

function generateBannerSvg(title: string, subtitle: string, cta: string, bgGrad: string, icon: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 450" width="1200" height="450">
  <defs>
    <linearGradient id="bGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgGrad}
    </linearGradient>
  </defs>
  <rect width="1200" height="450" rx="28" fill="url(#bGrad)"/>
  <circle cx="1020" cy="225" r="220" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="980" cy="225" r="160" fill="#ffffff" fill-opacity="0.2"/>
  <text x="980" y="270" font-size="130" text-anchor="middle">${icon}</text>
  <rect x="80" y="60" width="180" height="36" rx="18" fill="#d8232a"/>
  <text x="170" y="84" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1">BIG BASKET FRESH</text>
  <text x="80" y="170" font-size="42" font-weight="900" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${title}</text>
  <text x="80" y="225" font-size="20" font-weight="500" fill="#475569" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${subtitle}</text>
  <rect x="80" y="280" width="220" height="54" rx="14" fill="#16a34a"/>
  <text x="190" y="314" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${cta} →</text>
</svg>`;
}

async function main() {
  const root = path.resolve(__dirname, '../../');
  const dirs = [
    path.join(root, 'assets/products'),
    path.join(root, 'assets/categories'),
    path.join(root, 'assets/banners'),
    path.join(root, 'client/public/assets/products'),
    path.join(root, 'client/public/assets/categories'),
    path.join(root, 'client/public/assets/banners'),
    path.join(root, 'uploads/products'),
    path.join(root, 'server/uploads/products'),
  ];

  dirs.forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // 1. Generate Products
  for (const [slug, vis] of Object.entries(productVisuals)) {
    const svg = generateProductSvg(vis);
    // Write as .png and .svg (browsers can render SVG saved as .png in <img> or .svg)
    fs.writeFileSync(path.join(root, `assets/products/${slug}.png`), svg, 'utf-8');
    fs.writeFileSync(path.join(root, `client/public/assets/products/${slug}.png`), svg, 'utf-8');
  }
  console.log(`✅ Generated ${Object.keys(productVisuals).length} product images.`);

  // 2. Generate Categories
  for (const [slug, vis] of Object.entries(categoryVisuals)) {
    const svg = generateCategorySvg(vis);
    fs.writeFileSync(path.join(root, `assets/categories/${slug}.png`), svg, 'utf-8');
    fs.writeFileSync(path.join(root, `client/public/assets/categories/${slug}.png`), svg, 'utf-8');
  }
  console.log(`✅ Generated ${Object.keys(categoryVisuals).length} category images.`);

  // 3. Generate Hero Banners
  const banners = [
    {
      file: 'hero-banner-1.jpg',
      title: 'Mega Grocery Festival — Up to 40% OFF',
      sub: 'Fresh Farm Produce & Daily Essentials Delivered in 15 Minutes!',
      cta: 'Shop Best Deals',
      grad: '<stop offset="0%" stop-color="#fef2f2"/><stop offset="100%" stop-color="#fee2e2"/>',
      icon: '🛒',
    },
    {
      file: 'hero-banner-2.jpg',
      title: 'Organic Dairy & Farm Fresh Bakery',
      sub: 'Pure Milk, Creamy Ghee, Paneer & Artisanal Breads at Direct Wholesale Prices',
      cta: 'Explore Dairy',
      grad: '<stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/>',
      icon: '🥛',
    },
    {
      file: 'hero-banner-3.jpg',
      title: 'Pantry Staples: Atta, Rice & Organic Dals',
      sub: '100% Unpolished Pulses & MP Sharbati Whole Wheat with Special Bulk Savings',
      cta: 'Stock Up Today',
      grad: '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
      icon: '🌾',
    },
  ];

  for (const b of banners) {
    const svg = generateBannerSvg(b.title, b.sub, b.cta, b.grad, b.icon);
    fs.writeFileSync(path.join(root, `assets/banners/${b.file}`), svg, 'utf-8');
    fs.writeFileSync(path.join(root, `client/public/assets/banners/${b.file}`), svg, 'utf-8');
  }
  console.log(`✅ Generated ${banners.length} promotional banners.`);
}

main().catch(console.error);
