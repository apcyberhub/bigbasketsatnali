/**
 * ==============================================================================
 * BIG BASKET - API ABSTRACTION LAYER (Mock Data / FastAPI Interface)
 * ==============================================================================
 * This module encapsulates all data fetching. In Master Prompt 2, it serves 60+
 * realistic mock products across 21 categories with instant Promise responses.
 * Later, this file connects to Python FastAPI endpoints without changing UI code.
 */

const LocalMartAPI = (function () {
  // 21 Master Categories
  const CATEGORIES = [
    { id: 'fruits-vegetables', name: 'Fruits & Vegetables', icon: '🥦', colorClass: 'cat-fruits', discount: 'Up to 35% OFF' },
    { id: 'atta-rice-dal', name: 'Atta, Rice & Dal', icon: '🌾', colorClass: 'cat-grains', discount: 'Up to 25% OFF' },
    { id: 'dairy-breakfast', name: 'Dairy & Breakfast', icon: '🥛', colorClass: 'cat-dairy', discount: 'Up to 20% OFF' },
    { id: 'bakery', name: 'Bakery & Bread', icon: '🍞', colorClass: 'cat-bakery', discount: 'Fresh Daily' },
    { id: 'biscuits', name: 'Biscuits & Cookies', icon: '🍪', colorClass: 'cat-snacks', discount: 'Up to 30% OFF' },
    { id: 'snacks', name: 'Snacks & Namkeen', icon: '🥨', colorClass: 'cat-snacks', discount: 'Up to 30% OFF' },
    { id: 'chocolates', name: 'Chocolates & Sweets', icon: '🍫', colorClass: 'cat-chocolates', discount: 'Up to 40% OFF' },
    { id: 'beverages', name: 'Beverages & Juices', icon: '🥤', colorClass: 'cat-beverages', discount: 'Up to 30% OFF' },
    { id: 'instant-food', name: 'Instant Food & Noodles', icon: '🍜', colorClass: 'cat-snacks', discount: 'Up to 25% OFF' },
    { id: 'masala-spices', name: 'Masala & Spices', icon: '🌶️', colorClass: 'cat-grains', discount: 'Up to 35% OFF' },
    { id: 'oil-ghee', name: 'Edible Oil & Ghee', icon: '🛢️', colorClass: 'cat-grains', discount: 'Up to 20% OFF' },
    { id: 'personal-care', name: 'Personal Care & Hygiene', icon: '🧴', colorClass: 'cat-personal', discount: 'Up to 45% OFF' },
    { id: 'beauty', name: 'Beauty & Skincare', icon: '💄', colorClass: 'cat-beauty', discount: 'Up to 40% OFF' },
    { id: 'household', name: 'Household Essentials', icon: '🧼', colorClass: 'cat-household', discount: 'Up to 35% OFF' },
    { id: 'cleaning', name: 'Cleaning & Floor Care', icon: '🧹', colorClass: 'cat-household', discount: 'Up to 40% OFF' },
    { id: 'baby-care', name: 'Baby Care & Diapers', icon: '👶', colorClass: 'cat-baby', discount: 'Up to 25% OFF' },
    { id: 'toys-games', name: 'Toys, Kids & Games', icon: '🧸', colorClass: 'cat-toys', discount: 'Up to 50% OFF' },
    { id: 'stationery', name: 'Stationery & Office', icon: '✏️', colorClass: 'cat-stationery', discount: 'Up to 30% OFF' },
    { id: 'home-kitchen', name: 'Home & Kitchen', icon: '🏠', colorClass: 'cat-home', discount: 'Up to 30% OFF' },
    { id: 'electronics', name: 'Electronics & Gadgets', icon: '📱', colorClass: 'cat-electronics', discount: 'Up to 35% OFF' },
    { id: 'pet-care', name: 'Pet Supplies & Food', icon: '🐶', colorClass: 'cat-pets', discount: 'Up to 20% OFF' }
  ];

  // 60+ Realistic Mock Products
  const PRODUCTS = [
    // 1. DAIRY & BREAKFAST
    {
      id: 'prod-001',
      name: 'Amul Taaza Homogenised Toned Milk',
      brand: 'Amul',
      category: 'dairy-breakfast',
      subcategory: 'Milk',
      weight: '1 L',
      sellingPrice: 56,
      mrp: 62,
      discount: 10,
      rating: 4.8,
      reviewCount: 1240,
      emoji: '🥛',
      badge: 'Bestseller',
      eta: '10 mins',
      stock: 45,
      inStock: true,
      tags: ['milk', 'toned milk', 'amul taaza', 'dairy', 'breakfast', 'fresh milk'],
      description: 'Amul Taaza is fresh pasteurized toned milk that is virtually free from bacteria. It undergoes stringent quality checks to deliver pure, creamy nutrition for your entire family.',
      highlights: ['Pasteurized & Homogenized', 'Zero preservative added', 'Rich in natural Calcium & Vitamin D3', 'Safe Tetra packaging'],
      specifications: { 'Brand': 'Amul', 'Shelf Life': '180 Days', 'Packaging': 'Tetra Pak', 'FSSAI License': '10012021000071', 'Country of Origin': 'India', 'Storage': 'Store in a cool dry place. Refrigerate once opened.' },
      frequentlyBoughtWith: ['prod-004', 'prod-005'],
      galleryImages: ['🥛', '🧈', '🍞']
    },
    {
      id: 'prod-002',
      name: 'Amul Salted Butter Block',
      brand: 'Amul',
      category: 'dairy-breakfast',
      subcategory: 'Butter',
      weight: '500 g',
      sellingPrice: 275,
      mrp: 295,
      discount: 7,
      rating: 4.9,
      reviewCount: 2150,
      emoji: '🧈',
      badge: 'Popular',
      eta: '10 mins',
      stock: 30,
      inStock: true,
      tags: ['butter', 'amul butter', 'dairy', 'salted butter', 'breakfast', 'maska'],
      description: 'The iconic Amul Butter made from pure cow and buffalo milk with delicious natural aroma and golden spreadability.',
      highlights: ['Utterly Butterly Delicious', 'Made from pure fresh cream', 'No artificial colors', 'Instant breakfast partner'],
      specifications: { 'Brand': 'Amul', 'Shelf Life': '12 Months', 'Packaging': 'Carton Pack', 'FSSAI License': '10012021000071', 'Country of Origin': 'India', 'Storage': 'Keep refrigerated at 4°C or below.' },
      frequentlyBoughtWith: ['prod-001', 'prod-005'],
      galleryImages: ['🧈', '🍞', '🥛']
    },
    {
      id: 'prod-003',
      name: 'Mother Dairy Classic Cow Milk',
      brand: 'Mother Dairy',
      category: 'dairy-breakfast',
      subcategory: 'Milk',
      weight: '500 ml',
      sellingPrice: 29,
      mrp: 32,
      discount: 9,
      rating: 4.7,
      reviewCount: 680,
      emoji: '🥛',
      badge: 'Daily Fresh',
      eta: '10 mins',
      stock: 50,
      inStock: true,
      tags: ['milk', 'cow milk', 'mother dairy', 'fresh dairy'],
      description: 'Pure and wholesome cow milk sourced directly from trusted farmers, rich in A2 protein and easily digestible.',
      highlights: ['100% Pure Cow Milk', 'Easily digestible', 'Fortified with Vitamin A & D', 'Direct from local dairy hubs'],
      specifications: { 'Brand': 'Mother Dairy', 'Shelf Life': '2 Days', 'Packaging': 'Pouch', 'FSSAI License': '10015011000210', 'Country of Origin': 'India', 'Storage': 'Keep refrigerated.' },
      frequentlyBoughtWith: ['prod-005', 'prod-017'],
      galleryImages: ['🥛', '🍞', '☕']
    },
    {
      id: 'prod-004',
      name: 'Britannia Cheese Slices',
      brand: 'Britannia',
      category: 'dairy-breakfast',
      subcategory: 'Cheese',
      weight: '200 g (10 Slices)',
      sellingPrice: 135,
      mrp: 155,
      discount: 13,
      rating: 4.8,
      reviewCount: 920,
      emoji: '🧀',
      badge: '13% OFF',
      eta: '12 mins',
      stock: 25,
      inStock: true,
      tags: ['cheese', 'cheese slice', 'britannia', 'sandwich cheese', 'dairy'],
      description: 'Rich, melt-in-the-mouth processed cheese slices packed with calcium and protein for sandwiches, burgers, and toast.',
      highlights: ['Individually wrapped slices', 'High Calcium content', 'Smooth melt texture', 'Ideal for sandwiches'],
      specifications: { 'Brand': 'Britannia', 'Shelf Life': '9 Months', 'Packaging': 'Pouch Box', 'FSSAI License': '10012031000014', 'Country of Origin': 'India', 'Storage': 'Store refrigerated.' },
      frequentlyBoughtWith: ['prod-005', 'prod-002'],
      galleryImages: ['🧀', '🍞', '🥪']
    },

    // 2. BAKERY
    {
      id: 'prod-005',
      name: 'Modern 100% Whole Wheat Brown Bread',
      brand: 'Modern',
      category: 'bakery',
      subcategory: 'Bread',
      weight: '400 g',
      sellingPrice: 48,
      mrp: 55,
      discount: 13,
      rating: 4.6,
      reviewCount: 840,
      emoji: '🍞',
      badge: 'High Fiber',
      eta: '10 mins',
      stock: 28,
      inStock: true,
      tags: ['bread', 'brown bread', 'whole wheat', 'bakery', 'modern bread', 'breakfast'],
      description: 'Baked fresh daily using 100% whole wheat flour. Loaded with natural dietary fiber, soft texture, and zero maida.',
      highlights: ['100% Whole Wheat Atta', 'Zero Maida added', 'Good source of natural fiber', 'Freshly baked daily'],
      specifications: { 'Brand': 'Modern', 'Shelf Life': '5 Days', 'Packaging': 'Polybags', 'FSSAI License': '10014043000856', 'Country of Origin': 'India', 'Storage': 'Keep in a cool and dry place away from direct sunlight.' },
      frequentlyBoughtWith: ['prod-001', 'prod-002'],
      galleryImages: ['🍞', '🧈', '🥛']
    },
    {
      id: 'prod-006',
      name: 'English Oven Premium Burger Buns',
      brand: 'English Oven',
      category: 'bakery',
      subcategory: 'Buns & Pav',
      weight: '300 g (Pack of 4)',
      sellingPrice: 45,
      mrp: 50,
      discount: 10,
      rating: 4.7,
      reviewCount: 430,
      emoji: '🍔',
      badge: 'Fresh',
      eta: '15 mins',
      stock: 20,
      inStock: true,
      tags: ['burger bun', 'buns', 'english oven', 'bakery', 'pav'],
      description: 'Extra soft, lightly toasted sesame-topped premium burger buns for homemade burgers and sliders.',
      highlights: ['Super soft & fluffy', 'Topped with white sesame', 'Baked with finest flour', 'Ready to grill'],
      specifications: { 'Brand': 'English Oven', 'Shelf Life': '4 Days', 'Packaging': 'Polybags', 'FSSAI License': '10013064000295', 'Country of Origin': 'India', 'Storage': 'Store in a cool and dry place.' },
      frequentlyBoughtWith: ['prod-004', 'prod-033'],
      galleryImages: ['🍔', '🧀', '🍟']
    },

    // 3. ATTA, RICE & DAL
    {
      id: 'prod-007',
      name: 'Aashirvaad Superior MP Sharbati Atta',
      brand: 'Aashirvaad',
      category: 'atta-rice-dal',
      subcategory: 'Flour & Atta',
      weight: '5 kg',
      sellingPrice: 245,
      mrp: 290,
      discount: 15,
      rating: 4.8,
      reviewCount: 3100,
      emoji: '🌾',
      badge: '15% OFF',
      eta: '15 mins',
      stock: 60,
      inStock: true,
      tags: ['atta', 'flour', 'wheat flour', 'aashirvaad', 'sharbati atta', 'staples', 'grocery'],
      description: 'Made from the heaviest grains of golden Sehore Sharbati wheat, ground using traditional chakki process for the softest rotis.',
      highlights: ['100% Pure MP Sharbati Wheat', 'Traditional Chakki ground', 'Absorbs more water for softer rotis', 'Zero Maida contamination'],
      specifications: { 'Brand': 'Aashirvaad (ITC)', 'Shelf Life': '3 Months', 'Packaging': 'Bag', 'FSSAI License': '10012031000312', 'Country of Origin': 'India', 'Storage': 'Store in airtight container.' },
      frequentlyBoughtWith: ['prod-008', 'prod-009'],
      galleryImages: ['🌾', '🫓', '🍚']
    },
    {
      id: 'prod-008',
      name: 'India Gate Basmati Rice Super Rozana',
      brand: 'India Gate',
      category: 'atta-rice-dal',
      subcategory: 'Rice',
      weight: '5 kg',
      sellingPrice: 420,
      mrp: 525,
      discount: 20,
      rating: 4.7,
      reviewCount: 1890,
      emoji: '🍚',
      badge: '20% OFF',
      eta: '15 mins',
      stock: 40,
      inStock: true,
      tags: ['rice', 'basmati rice', 'india gate', 'rozana rice', 'staples', 'biryani rice'],
      description: 'Aged long-grain basmati rice with distinct fragrant aroma and fluffy non-sticky grains, ideal for daily meals and pulao.',
      highlights: ['Aged premium grains', 'Non-sticky and aromatic', 'Puff up to twice its length', 'Cleaned & sortexed'],
      specifications: { 'Brand': 'India Gate', 'Shelf Life': '24 Months', 'Packaging': 'Polybag', 'FSSAI License': '10012011000128', 'Country of Origin': 'India', 'Storage': 'Store in dry place.' },
      frequentlyBoughtWith: ['prod-007', 'prod-009'],
      galleryImages: ['🍚', '🌾', '🍲']
    },
    {
      id: 'prod-009',
      name: 'Tata Sampann Unpolished Toor Dal',
      brand: 'Tata Sampann',
      category: 'atta-rice-dal',
      subcategory: 'Pulses & Dal',
      weight: '1 kg',
      sellingPrice: 165,
      mrp: 195,
      discount: 15,
      rating: 4.8,
      reviewCount: 1420,
      emoji: '🥣',
      badge: 'Unpolished',
      eta: '12 mins',
      stock: 35,
      inStock: true,
      tags: ['toor dal', 'arhar dal', 'tata sampann', 'pulses', 'dal', 'staples', 'protein'],
      description: 'Tata Sampann Toor Dal is unpolished, meaning it does not undergo artificial water, oil, or leather polishing, retaining its natural goodness and wholesome protein.',
      highlights: ['100% Unpolished Dal', 'High Protein & Fiber', 'Strict 5-step purity process', 'Authentic aroma & taste'],
      specifications: { 'Brand': 'Tata Sampann', 'Shelf Life': '12 Months', 'Packaging': 'Pouch', 'FSSAI License': '10014022002752', 'Country of Origin': 'India', 'Storage': 'Keep in a cool and dry container.' },
      frequentlyBoughtWith: ['prod-007', 'prod-008'],
      galleryImages: ['🥣', '🌾', '🍚']
    },
    {
      id: 'prod-010',
      name: 'Fortune Sunlite Refined Sunflower Oil',
      brand: 'Fortune',
      category: 'oil-ghee',
      subcategory: 'Cooking Oil',
      weight: '1 L',
      sellingPrice: 138,
      mrp: 175,
      discount: 21,
      rating: 4.6,
      reviewCount: 950,
      emoji: '🌻',
      badge: '21% OFF',
      eta: '12 mins',
      stock: 45,
      inStock: true,
      tags: ['oil', 'cooking oil', 'sunflower oil', 'fortune oil', 'edible oil'],
      description: 'Light, healthy refined sunflower oil enriched with Vitamins A and D, with high smoke point perfect for deep frying and daily cooking.',
      highlights: ['Fortified with Vitamin A & D', 'Light & easy to digest', 'High smoke point for crisp frying', 'Zero cholesterol'],
      specifications: { 'Brand': 'Fortune (Adani Wilmar)', 'Shelf Life': '9 Months', 'Packaging': 'Pouch', 'FSSAI License': '10013021000854', 'Country of Origin': 'India', 'Storage': 'Store in cool place.' },
      frequentlyBoughtWith: ['prod-007', 'prod-011'],
      galleryImages: ['🌻', '🛢️', '🌾']
    },
    {
      id: 'prod-011',
      name: 'Amul Pure Desi Ghee Tin',
      brand: 'Amul',
      category: 'oil-ghee',
      subcategory: 'Ghee',
      weight: '1 L',
      sellingPrice: 595,
      mrp: 660,
      discount: 10,
      rating: 4.9,
      reviewCount: 2800,
      emoji: '🛢️',
      badge: 'Pure Desi Ghee',
      eta: '15 mins',
      stock: 25,
      inStock: true,
      tags: ['ghee', 'desi ghee', 'amul ghee', 'pure ghee', 'cow ghee'],
      description: 'Traditional granular aromatic desi ghee prepared from fresh cream, ideal for sweets, tadka, dal, and everyday rotis.',
      highlights: ['100% Pure Milk Fat', 'Aromatic granular texture', 'Rich source of Vitamin A', 'Traditional recipe'],
      specifications: { 'Brand': 'Amul', 'Shelf Life': '12 Months', 'Packaging': 'Tin Container', 'FSSAI License': '10012021000071', 'Country of Origin': 'India', 'Storage': 'Store in cool dry place.' },
      frequentlyBoughtWith: ['prod-007', 'prod-009'],
      galleryImages: ['🛢️', '🌾', '🫓']
    },

    // 4. FRUITS & VEGETABLES
    {
      id: 'prod-012',
      name: 'Farm Fresh Hybrid Red Tomatoes',
      brand: 'Local Farm Fresh',
      category: 'fruits-vegetables',
      subcategory: 'Vegetables',
      weight: '1 kg',
      sellingPrice: 34,
      mrp: 45,
      discount: 24,
      rating: 4.8,
      reviewCount: 1650,
      emoji: '🍅',
      badge: 'Farm Fresh',
      eta: '10 mins',
      stock: 80,
      inStock: true,
      tags: ['tomato', 'tomatoes', 'tamatar', 'fresh vegetables', 'local farm', 'salad'],
      description: 'Handpicked plump, ripe red hybrid tomatoes sourced daily at 4 AM directly from verified local mandis and hydroponic farms.',
      highlights: ['Hydro-cooled for freshness', 'Zero chemical ripeners', 'Rich in Lycopene antioxidant', 'Direct from local farmers'],
      specifications: { 'Brand': 'Big Basket Farm Fresh', 'Shelf Life': '4-5 Days', 'Packaging': 'Net Bag', 'Country of Origin': 'India', 'Storage': 'Keep at room temp until ripe, then refrigerate.' },
      frequentlyBoughtWith: ['prod-013', 'prod-014'],
      galleryImages: ['🍅', '🧅', '🥔']
    },
    {
      id: 'prod-013',
      name: 'Fresh Nashik Red Onions (Pyaz)',
      brand: 'Local Farm Fresh',
      category: 'fruits-vegetables',
      subcategory: 'Vegetables',
      weight: '1 kg',
      sellingPrice: 38,
      mrp: 48,
      discount: 21,
      rating: 4.7,
      reviewCount: 1980,
      emoji: '🧅',
      badge: 'Top Pick',
      eta: '10 mins',
      stock: 90,
      inStock: true,
      tags: ['onion', 'onions', 'pyaz', 'vegetables', 'staples', 'nashik onion'],
      description: 'Firm and pungent high-grade Nashik red onions with multiple layers, perfect for rich gravies, salads, and tadka.',
      highlights: ['Premium Grade-A Nashik crop', 'Naturally cured & sorted', 'Long shelf life', 'Zero spoilage guarantee'],
      specifications: { 'Brand': 'Big Basket Farm Fresh', 'Shelf Life': '14 Days', 'Packaging': 'Mesh Bag', 'Country of Origin': 'India', 'Storage': 'Keep in well-ventilated dry place.' },
      frequentlyBoughtWith: ['prod-012', 'prod-014'],
      galleryImages: ['🧅', '🥔', '🍅']
    },
    {
      id: 'prod-014',
      name: 'Fresh Farm Potatoes (Aloo)',
      brand: 'Local Farm Fresh',
      category: 'fruits-vegetables',
      subcategory: 'Vegetables',
      weight: '1 kg',
      sellingPrice: 32,
      mrp: 40,
      discount: 20,
      rating: 4.7,
      reviewCount: 1400,
      emoji: '🥔',
      badge: 'Essential',
      eta: '10 mins',
      stock: 100,
      inStock: true,
      tags: ['potato', 'potatoes', 'aloo', 'vegetables', 'staples'],
      description: 'Clean, skin-firm fresh potatoes ideal for boiling, curries, french fries, and everyday Indian dishes.',
      highlights: ['Low sugar content', 'Easy to peel', 'Firm & solid texture', 'Sorted & cleaned'],
      specifications: { 'Brand': 'Big Basket Farm Fresh', 'Shelf Life': '10 Days', 'Packaging': 'Mesh Bag', 'Country of Origin': 'India', 'Storage': 'Store in dark, cool, dry place.' },
      frequentlyBoughtWith: ['prod-012', 'prod-013'],
      galleryImages: ['🥔', '🧅', '🍅']
    },
    {
      id: 'prod-015',
      name: 'Royal Delicious Kashmiri Red Apples',
      brand: 'Fresh Orchard',
      category: 'fruits-vegetables',
      subcategory: 'Fruits',
      weight: '1 kg (4-5 pcs)',
      sellingPrice: 175,
      mrp: 220,
      discount: 20,
      rating: 4.9,
      reviewCount: 1120,
      emoji: '🍎',
      badge: 'Sweet & Crisp',
      eta: '12 mins',
      stock: 40,
      inStock: true,
      tags: ['apple', 'apples', 'seb', 'kashmiri apple', 'fruits', 'fresh fruit'],
      description: 'Crunchy, sweet, and aromatic handpicked Kashmiri apples from high altitude orchards. Naturally waxed and wax-free washed.',
      highlights: ['Crisp juicy bite', 'Naturally sweet aroma', 'Rich in dietary fiber', 'Wax-free clean fruit'],
      specifications: { 'Brand': 'Fresh Orchard', 'Shelf Life': '7-10 Days', 'Packaging': 'Foam Net Box', 'Country of Origin': 'India (Kashmir)', 'Storage': 'Refrigerate for crispness.' },
      frequentlyBoughtWith: ['prod-016', 'prod-001'],
      galleryImages: ['🍎', '🍌', '🍊']
    },
    {
      id: 'prod-016',
      name: 'Fresh Robusta Golden Bananas (Kela)',
      brand: 'Fresh Orchard',
      category: 'fruits-vegetables',
      subcategory: 'Fruits',
      weight: '1 kg (approx 6 pcs)',
      sellingPrice: 52,
      mrp: 65,
      discount: 20,
      rating: 4.8,
      reviewCount: 890,
      emoji: '🍌',
      badge: 'Naturally Ripened',
      eta: '10 mins',
      stock: 60,
      inStock: true,
      tags: ['banana', 'bananas', 'kela', 'fruits', 'potassium', 'energy'],
      description: 'Ethylene-chamber naturally ripened sweet golden bananas, free from carbide chemicals.',
      highlights: ['100% Carbide-free ripening', 'Instant energy booster', 'Rich in Potassium & B6', 'Sweet creamy pulp'],
      specifications: { 'Brand': 'Fresh Orchard', 'Shelf Life': '3-4 Days', 'Packaging': 'Bunch Pouch', 'Country of Origin': 'India', 'Storage': 'Store at room temperature.' },
      frequentlyBoughtWith: ['prod-015', 'prod-001'],
      galleryImages: ['🍌', '🍎', '🥛']
    },

    // 5. BEVERAGES
    {
      id: 'prod-017',
      name: 'Tata Tea Gold Premium Black Tea',
      brand: 'Tata Tea',
      category: 'beverages',
      subcategory: 'Tea',
      weight: '500 g',
      sellingPrice: 285,
      mrp: 340,
      discount: 16,
      rating: 4.8,
      reviewCount: 2400,
      emoji: '☕',
      badge: '16% OFF',
      eta: '12 mins',
      stock: 35,
      inStock: true,
      tags: ['tea', 'chai', 'tata tea', 'tata tea gold', 'beverages', 'black tea'],
      description: 'A delicate blend of fine Assam CTC teas with 15% gently rolled long aromatic leaves for the perfect aroma and strong cup of morning chai.',
      highlights: ['Rich Assam CTC + Long Leaves', 'Irresistible rich aroma', 'Authentic full-bodied color', 'Signature blend'],
      specifications: { 'Brand': 'Tata Consumer Products', 'Shelf Life': '12 Months', 'Packaging': 'Pouch', 'FSSAI License': '10014031001025', 'Country of Origin': 'India', 'Storage': 'Store in airtight jar.' },
      frequentlyBoughtWith: ['prod-001', 'prod-019'],
      galleryImages: ['☕', '🥛', '🍪']
    },
    {
      id: 'prod-018',
      name: 'Nescafe Classic Instant Coffee Powder',
      brand: 'Nescafe',
      category: 'beverages',
      subcategory: 'Coffee',
      weight: '100 g Glass Jar',
      sellingPrice: 198,
      mrp: 230,
      discount: 14,
      rating: 4.9,
      reviewCount: 1750,
      emoji: '☕',
      badge: 'Signature',
      eta: '10 mins',
      stock: 30,
      inStock: true,
      tags: ['coffee', 'nescafe', 'instant coffee', 'beverages', 'nescafe classic'],
      description: 'Crafted with 100% pure Robusta and Arabica coffee beans, roasted to perfection for that classic bold aroma and rich morning boost.',
      highlights: ['100% Pure Coffee Beans', 'Distinctive full-bodied roast', 'Dissolves instantly in hot/cold milk', 'Sealed glass freshness'],
      specifications: { 'Brand': 'Nestle', 'Shelf Life': '24 Months', 'Packaging': 'Glass Jar', 'FSSAI License': '10012011000168', 'Country of Origin': 'India', 'Storage': 'Close lid tightly after use.' },
      frequentlyBoughtWith: ['prod-001', 'prod-022'],
      galleryImages: ['☕', '🥛', '🍫']
    },
    {
      id: 'prod-019',
      name: 'Real Fruit Power 100% Mixed Fruit Juice',
      brand: 'Real',
      category: 'beverages',
      subcategory: 'Juices',
      weight: '1 L',
      sellingPrice: 110,
      mrp: 140,
      discount: 21,
      rating: 4.7,
      reviewCount: 880,
      emoji: '🧃',
      badge: '21% OFF',
      eta: '12 mins',
      stock: 25,
      inStock: true,
      tags: ['juice', 'real juice', 'mixed fruit juice', 'beverages', 'fruit drink'],
      description: 'A delicious combination of 9 exotic fruits rich in Vitamin C with zero added preservatives and no artificial colors.',
      highlights: ['Blend of 9 nutritious fruits', 'Rich in Vitamin C', 'No added preservatives', 'Aseptic 6-layer Tetra pack'],
      specifications: { 'Brand': 'Dabur Real', 'Shelf Life': '7 Months', 'Packaging': 'Tetra Pak', 'FSSAI License': '10012012000057', 'Country of Origin': 'India', 'Storage': 'Refrigerate after opening and consume within 5 days.' },
      frequentlyBoughtWith: ['prod-020', 'prod-021'],
      galleryImages: ['🧃', '🥤', '🥨']
    },

    // 6. BISCUITS & SNACKS
    {
      id: 'prod-020',
      name: 'Parle-G Gold Glucose Biscuits',
      brand: 'Parle',
      category: 'biscuits',
      subcategory: 'Glucose Biscuits',
      weight: '1 kg Value Pack',
      sellingPrice: 95,
      mrp: 110,
      discount: 14,
      rating: 4.9,
      reviewCount: 3800,
      emoji: '🍪',
      badge: 'All-Time Favorite',
      eta: '10 mins',
      stock: 75,
      inStock: true,
      tags: ['biscuit', 'parle g', 'glucose biscuit', 'cookies', 'chai biscuit', 'snacks'],
      description: 'India’s favorite tea-time biscuit with golden crunch, wheat goodness, and unmistakable taste cherished by generations.',
      highlights: ['Enriched with Wheat & Milk', 'Quick Energy Source', 'Perfect companion for tea & milk', 'Great value family pack'],
      specifications: { 'Brand': 'Parle Products', 'Shelf Life': '6 Months', 'Packaging': 'Multi-Pack Polybag', 'FSSAI License': '10012022000132', 'Country of Origin': 'India', 'Storage': 'Keep in airtight container.' },
      frequentlyBoughtWith: ['prod-017', 'prod-001'],
      galleryImages: ['🍪', '☕', '🥛']
    },
    {
      id: 'prod-021',
      name: 'Cadbury Oreo Vanilla Creme Biscuit',
      brand: 'Oreo (Cadbury)',
      category: 'biscuits',
      subcategory: 'Creme Biscuits',
      weight: '300 g Family Pack',
      sellingPrice: 75,
      mrp: 90,
      discount: 17,
      rating: 4.8,
      reviewCount: 2100,
      emoji: '🍪',
      badge: '17% OFF',
      eta: '10 mins',
      stock: 40,
      inStock: true,
      tags: ['oreo', 'cadbury oreo', 'creme biscuit', 'chocolate biscuit', 'cookies', 'snacks'],
      description: 'Rich dark chocolate crunchy cookies sandwiching velvety vanilla creme filling. Twist, Lick, Dunk in cold milk!',
      highlights: ['Crunchy Cocoa Cookies', 'Velvety Sweet Vanilla Creme', 'Perfect for ice cream & milkshakes', 'Family snack pack'],
      specifications: { 'Brand': 'Mondelez Cadbury', 'Shelf Life': '9 Months', 'Packaging': 'Box Pack', 'FSSAI License': '10014022002711', 'Country of Origin': 'India', 'Storage': 'Store in cool dry place.' },
      frequentlyBoughtWith: ['prod-001', 'prod-022'],
      galleryImages: ['🍪', '🥛', '🍫']
    },
    {
      id: 'prod-022',
      name: 'Haldiram\'s Nagpur Bhujia Sev',
      brand: 'Haldiram\'s',
      category: 'snacks',
      subcategory: 'Namkeen',
      weight: '400 g',
      sellingPrice: 105,
      mrp: 125,
      discount: 16,
      rating: 4.8,
      reviewCount: 1950,
      emoji: '🥨',
      badge: 'Crispy Snack',
      eta: '10 mins',
      stock: 50,
      inStock: true,
      tags: ['namkeen', 'bhujia', 'haldiram', 'bhujia sev', 'snacks', 'moth dal'],
      description: 'Crispy, spicy moth bean and besan noodle snacks seasoned with authentic Rajasthani spices, black pepper, and clove.',
      highlights: ['Crispy Moth Bean Sev', 'Authentic Indian Spices', 'Zero trans fat', 'Nitrogen-flushed pack for fresh crunch'],
      specifications: { 'Brand': 'Haldiram Snacks', 'Shelf Life': '6 Months', 'Packaging': 'Pouch', 'FSSAI License': '10012011000676', 'Country of Origin': 'India', 'Storage': 'Keep sealed to prevent moisture.' },
      frequentlyBoughtWith: ['prod-017', 'prod-020'],
      galleryImages: ['🥨', '☕', '🥤']
    },
    {
      id: 'prod-023',
      name: 'Lay\'s India\'s Magic Masala Potato Chips',
      brand: 'Lay\'s',
      category: 'snacks',
      subcategory: 'Chips & Crisps',
      weight: '115 g Party Pack',
      sellingPrice: 45,
      mrp: 50,
      discount: 10,
      rating: 4.7,
      reviewCount: 1600,
      emoji: '🥔',
      badge: 'Magic Masala',
      eta: '10 mins',
      stock: 45,
      inStock: true,
      tags: ['chips', 'lays', 'potato chips', 'magic masala', 'snacks', 'crisps'],
      description: 'Crisp wafer-thin potato chips coated in hot spicy authentic Indian masala mix.',
      highlights: ['100% Farm-grown potatoes', 'Signature Magic Masala spice mix', 'Ultra-crisp bite', 'Party pack size'],
      specifications: { 'Brand': 'PepsiCo India', 'Shelf Life': '4 Months', 'Packaging': 'Pouch', 'FSSAI License': '10014064000435', 'Country of Origin': 'India', 'Storage': 'Store in cool place.' },
      frequentlyBoughtWith: ['prod-019', 'prod-022'],
      galleryImages: ['🥔', '🥤', '🥨']
    },

    // 7. CHOCOLATES & SWEETS
    {
      id: 'prod-024',
      name: 'Cadbury Dairy Milk Silk Chocolate Bar',
      brand: 'Cadbury',
      category: 'chocolates',
      subcategory: 'Chocolate Bars',
      weight: '150 g',
      sellingPrice: 165,
      mrp: 185,
      discount: 11,
      rating: 4.9,
      reviewCount: 4200,
      emoji: '🍫',
      badge: 'Best Lover',
      eta: '10 mins',
      stock: 55,
      inStock: true,
      tags: ['chocolate', 'cadbury', 'dairy milk', 'silk', 'sweet', 'cadbury silk', 'dessert'],
      description: 'Silk is made with a glass and a half of milk, creating the silkiest, smoothest chocolate bar that melts luxuriously in your mouth.',
      highlights: ['Smoother, Creamier, Silkier', '100% Sustainably sourced Cocoa', 'Melt-in-mouth texture', 'Premium chocolate block'],
      specifications: { 'Brand': 'Mondelez Cadbury', 'Shelf Life': '12 Months', 'Packaging': 'Foil Wrapped Carton', 'FSSAI License': '10014022002711', 'Country of Origin': 'India', 'Storage': 'Store in cool, dry place (15-20°C).' },
      frequentlyBoughtWith: ['prod-025', 'prod-021'],
      galleryImages: ['🍫', '🍪', '🥛']
    },
    {
      id: 'prod-025',
      name: 'Nestle KitKat 4-Finger Chocolate Wafer',
      brand: 'Nestle',
      category: 'chocolates',
      subcategory: 'Wafer Chocolates',
      weight: 'Pack of 3 (115 g)',
      sellingPrice: 75,
      mrp: 90,
      discount: 17,
      rating: 4.8,
      reviewCount: 1800,
      emoji: '🍫',
      badge: 'Have a Break',
      eta: '10 mins',
      stock: 45,
      inStock: true,
      tags: ['kitkat', 'nestle', 'wafer', 'chocolate', 'chocolate wafer', 'snacks'],
      description: 'Crispy wafer fingers covered in smooth milk chocolate. Have a break, have a KitKat!',
      highlights: ['Crispy baked wafer', 'Rich smooth milk chocolate', 'Iconic snap fingers', 'Pack of 3 value bundle'],
      specifications: { 'Brand': 'Nestle India', 'Shelf Life': '9 Months', 'Packaging': 'Foil Pouch', 'FSSAI License': '10012011000168', 'Country of Origin': 'India', 'Storage': 'Store in cool place.' },
      frequentlyBoughtWith: ['prod-024', 'prod-021'],
      galleryImages: ['🍫', '🍪', '☕']
    },
    {
      id: 'prod-026',
      name: 'Ferrero Rocher Hazelnut Praline Box',
      brand: 'Ferrero',
      category: 'chocolates',
      subcategory: 'Gift Chocolates',
      weight: '200 g (16 Pieces)',
      sellingPrice: 495,
      mrp: 595,
      discount: 17,
      rating: 4.9,
      reviewCount: 1540,
      emoji: '🍬',
      badge: 'Premium Gift',
      eta: '15 mins',
      stock: 20,
      inStock: true,
      tags: ['ferrero rocher', 'chocolate', 'hazelnut', 'premium chocolate', 'gift box', 'sweets'],
      description: 'Crisp whole hazelnut wrapped in rich creamy hazelnut filling, enclosed in a crisp wafer shell covered with milk chocolate and chopped hazelnut pieces.',
      highlights: ['Whole roasted hazelnut center', 'Velvety hazelnut cream layer', 'Golden foil gift packaging', 'Luxury Italian recipe'],
      specifications: { 'Brand': 'Ferrero Rocher', 'Shelf Life': '9 Months', 'Packaging': 'Transparent Acrylic Gift Box', 'FSSAI License': '10012022000257', 'Country of Origin': 'Italy / India', 'Storage': 'Store at 18-22°C.' },
      frequentlyBoughtWith: ['prod-024', 'prod-018'],
      galleryImages: ['🍬', '🍫', '🎁']
    },

    // 8. INSTANT FOOD & NOODLES
    {
      id: 'prod-027',
      name: 'Nestle Maggi 2-Minute Masala Noodles',
      brand: 'Maggi',
      category: 'instant-food',
      subcategory: 'Noodles',
      weight: '560 g (Pack of 8)',
      sellingPrice: 110,
      mrp: 128,
      discount: 14,
      rating: 4.9,
      reviewCount: 5200,
      emoji: '🍜',
      badge: 'Super Saver',
      eta: '10 mins',
      stock: 65,
      inStock: true,
      tags: ['maggi', 'instant noodles', 'masala noodles', 'nestle maggi', 'quick meal', 'snacks'],
      description: 'India\'s most loved 2-minute instant noodles prepared with signature blend of 10 spices and fortified with Iron.',
      highlights: ['Fortified with Iron (15% RDA)', 'Signature roasted spice Tastemaker', 'Ready in just 2 minutes', 'Pack of 8 family bundle'],
      specifications: { 'Brand': 'Nestle Maggi', 'Shelf Life': '8 Months', 'Packaging': 'Multi-Pack', 'FSSAI License': '10012011000168', 'Country of Origin': 'India', 'Storage': 'Store in cool dry place.' },
      frequentlyBoughtWith: ['prod-028', 'prod-033'],
      galleryImages: ['🍜', '🧀', '🍅']
    },
    {
      id: 'prod-028',
      name: 'Knorr Classic Mixed Vegetable Soup',
      brand: 'Knorr',
      category: 'instant-food',
      subcategory: 'Instant Soups',
      weight: '43 g (Pack of 2)',
      sellingPrice: 65,
      mrp: 75,
      discount: 13,
      rating: 4.6,
      reviewCount: 510,
      emoji: '🥣',
      badge: 'Warm & Healthy',
      eta: '12 mins',
      stock: 35,
      inStock: true,
      tags: ['soup', 'knorr soup', 'instant soup', 'vegetable soup', 'instant food'],
      description: 'Hot, hearty, and aromatic soup loaded with real crunchy vegetables and savory spices. Serves 4.',
      highlights: ['100% Real vegetable chunks', 'No added preservatives', 'Ready in 3 minutes on stove', 'Low calorie appetizer'],
      specifications: { 'Brand': 'Hindustan Unilever (Knorr)', 'Shelf Life': '12 Months', 'Packaging': 'Pouch', 'FSSAI License': '10013022001897', 'Country of Origin': 'India', 'Storage': 'Store in dry place.' },
      frequentlyBoughtWith: ['prod-005', 'prod-027'],
      galleryImages: ['🥣', '🍞', '🍜']
    },

    // 9. MASALA & SPICES
    {
      id: 'prod-029',
      name: 'Everest Shahi Garam Masala Powder',
      brand: 'Everest',
      category: 'masala-spices',
      subcategory: 'Blended Spices',
      weight: '100 g',
      sellingPrice: 82,
      mrp: 95,
      discount: 14,
      rating: 4.8,
      reviewCount: 1620,
      emoji: '🌶️',
      badge: 'Aromatic',
      eta: '12 mins',
      stock: 45,
      inStock: true,
      tags: ['masala', 'garam masala', 'everest', 'spices', 'shahi garam masala', 'curry spice'],
      description: 'Crafted with 13 handpicked whole spices slowly ground at low temperatures to lock in rich aroma and intense flavors.',
      highlights: ['Low Temperature Grinding (LTG)', '13 Select whole spices', 'Authentic culinary aroma', 'Zero adulteration'],
      specifications: { 'Brand': 'Everest Spices', 'Shelf Life': '12 Months', 'Packaging': 'Carton Box', 'FSSAI License': '10012022000072', 'Country of Origin': 'India', 'Storage': 'Transfer to airtight container.' },
      frequentlyBoughtWith: ['prod-030', 'prod-007'],
      galleryImages: ['🌶️', '🌾', '🍚']
    },
    {
      id: 'prod-030',
      name: 'MDH Deggi Mirch Kashmiri Chilli Powder',
      brand: 'MDH',
      category: 'masala-spices',
      subcategory: 'Pure Spices',
      weight: '100 g',
      sellingPrice: 78,
      mrp: 90,
      discount: 13,
      rating: 4.8,
      reviewCount: 1840,
      emoji: '🌶️',
      badge: 'Natural Color',
      eta: '12 mins',
      stock: 40,
      inStock: true,
      tags: ['chilli powder', 'deggi mirch', 'mdh', 'kashmiri mirch', 'spices', 'red chilli'],
      description: 'A unique blend of Indian red peppers that imparts a glowing natural red color without excessive pungency.',
      highlights: ['Rich glowing red gravy color', 'Mild balanced spiciness', 'Hygienically ground', 'Famous MDH heritage'],
      specifications: { 'Brand': 'MDH Spices', 'Shelf Life': '12 Months', 'Packaging': 'Box', 'FSSAI License': '10012011000439', 'Country of Origin': 'India', 'Storage': 'Keep dry.' },
      frequentlyBoughtWith: ['prod-029', 'prod-007'],
      galleryImages: ['🌶️', '🌾', '🍲']
    },

    // 10. PERSONAL CARE & HYGIENE
    {
      id: 'prod-031',
      name: 'Dettol Original Germ Protection Soap',
      brand: 'Dettol',
      category: 'personal-care',
      subcategory: 'Bath & Soap',
      weight: 'Pack of 5 (125 g each)',
      sellingPrice: 245,
      mrp: 295,
      discount: 17,
      rating: 4.8,
      reviewCount: 3400,
      emoji: '🧼',
      badge: '100% Protection',
      eta: '12 mins',
      stock: 55,
      inStock: true,
      tags: ['soap', 'dettol', 'bath soap', 'germ protection', 'personal care', 'dettol soap'],
      description: 'Trusted Dettol soap formulated with 99.9% germ protection and skin moisturizers to keep your family healthy and refreshed.',
      highlights: ['99.9% Protection against illness-causing germs', 'Contains moisturizing plant-derived glycerin', 'Recommended by Indian Medical Association', 'Value bundle pack of 5'],
      specifications: { 'Brand': 'Reckitt Benckiser (Dettol)', 'Shelf Life': '24 Months', 'Packaging': 'Multipack', 'Country of Origin': 'India', 'Storage': 'Store in dry place.' },
      frequentlyBoughtWith: ['prod-032', 'prod-034'],
      galleryImages: ['🧼', '🧴', '🚿']
    },
    {
      id: 'prod-032',
      name: 'Colgate Strong Teeth Calcium Dental Cream',
      brand: 'Colgate',
      category: 'personal-care',
      subcategory: 'Oral Care',
      weight: '500 g (2x250g Saver Pack)',
      sellingPrice: 198,
      mrp: 240,
      discount: 18,
      rating: 4.8,
      reviewCount: 2900,
      emoji: '🪥',
      badge: 'Strong Teeth',
      eta: '10 mins',
      stock: 45,
      inStock: true,
      tags: ['toothpaste', 'colgate', 'colgate strong teeth', 'oral care', 'toothpaste saver'],
      description: 'Amino Shakti formula adds natural calcium to your teeth, making them 2x stronger against acid attacks and cavities.',
      highlights: ['Amino Shakti Calcium Booster', 'Prevents Cavities and Plaque', 'Fresh Minty Breath', 'IDA Certified Toothpaste'],
      specifications: { 'Brand': 'Colgate-Palmolive', 'Shelf Life': '24 Months', 'Packaging': 'Twin Pack Tube', 'Country of Origin': 'India', 'Storage': 'Keep cap closed.' },
      frequentlyBoughtWith: ['prod-031', 'prod-033'],
      galleryImages: ['🪥', '🧼', '🧴']
    },
    {
      id: 'prod-033',
      name: 'Head & Shoulders Cool Menthol Anti-Dandruff Shampoo',
      brand: 'Head & Shoulders',
      category: 'personal-care',
      subcategory: 'Hair Care',
      weight: '650 ml Pump Bottle',
      sellingPrice: 485,
      mrp: 620,
      discount: 22,
      rating: 4.7,
      reviewCount: 1670,
      emoji: '🧴',
      badge: '22% OFF',
      eta: '15 mins',
      stock: 25,
      inStock: true,
      tags: ['shampoo', 'head and shoulders', 'anti dandruff', 'hair care', 'cool menthol'],
      description: 'Formulated with refreshing cooling menthol and clinically proven Zinc Pyrithione formula to eliminate up to 100% dandruff flakes.',
      highlights: ['Up to 100% Dandruff Free', 'Cooling Menthol Freshness', 'Gentle for daily use', 'Convenient pump dispenser'],
      specifications: { 'Brand': 'Procter & Gamble (P&G)', 'Shelf Life': '36 Months', 'Packaging': 'Pump Bottle', 'Country of Origin': 'India', 'Storage': 'Keep at room temperature.' },
      frequentlyBoughtWith: ['prod-031', 'prod-034'],
      galleryImages: ['🧴', '🧼', '🚿']
    },

    // 11. BEAUTY & SKINCARE
    {
      id: 'prod-034',
      name: 'NIVEA Soft Light Moisturizing Cream',
      brand: 'NIVEA',
      category: 'beauty',
      subcategory: 'Skin Care',
      weight: '200 ml Tub',
      sellingPrice: 260,
      mrp: 330,
      discount: 21,
      rating: 4.8,
      reviewCount: 2200,
      emoji: '🧴',
      badge: 'Non-Greasy',
      eta: '15 mins',
      stock: 30,
      inStock: true,
      tags: ['nivea', 'moisturizer', 'nivea soft', 'skin cream', 'beauty', 'face cream'],
      description: 'Quick-absorbing, non-sticky daily light cream enriched with Jojoba Oil and Vitamin E for deeply refreshed, soft, and supple skin.',
      highlights: ['Light non-greasy formula', 'Jojoba Oil & Vitamin E', 'Instant hydration for face & body', 'Dermatologically tested'],
      specifications: { 'Brand': 'Beiersdorf Nivea', 'Shelf Life': '30 Months', 'Packaging': 'Tub Jar', 'Country of Origin': 'India', 'Storage': 'Store in cool place.' },
      frequentlyBoughtWith: ['prod-035', 'prod-031'],
      galleryImages: ['🧴', '💄', '🧼']
    },
    {
      id: 'prod-035',
      name: 'Himalaya Purifying Neem Face Wash',
      brand: 'Himalaya',
      category: 'beauty',
      subcategory: 'Face Care',
      weight: '300 ml Pump Pack',
      sellingPrice: 280,
      mrp: 350,
      discount: 20,
      rating: 4.7,
      reviewCount: 1980,
      emoji: '🧴',
      badge: 'Pimple Clear',
      eta: '15 mins',
      stock: 35,
      inStock: true,
      tags: ['face wash', 'himalaya', 'neem face wash', 'beauty', 'skincare', 'acne clear'],
      description: 'Soap-free herbal formulation that clears impurities and helps prevent pimples using natural antibacterial Neem and Turmeric.',
      highlights: ['Herbal Neem & Turmeric', 'Soap-free formula', 'Prevents acne breakouts', 'Controls excess oil'],
      specifications: { 'Brand': 'Himalaya Herbals', 'Shelf Life': '36 Months', 'Packaging': 'Pump Bottle', 'Country of Origin': 'India', 'Storage': 'Keep in cool dry place.' },
      frequentlyBoughtWith: ['prod-034', 'prod-031'],
      galleryImages: ['🧴', '🌿', '💄']
    },

    // 12. HOUSEHOLD & CLEANING
    {
      id: 'prod-036',
      name: 'Surf Excel Matic Top Load Detergent Liquid',
      brand: 'Surf Excel',
      category: 'household',
      subcategory: 'Laundry Care',
      weight: '2 L Refill Pouch',
      sellingPrice: 385,
      mrp: 470,
      discount: 18,
      rating: 4.9,
      reviewCount: 3600,
      emoji: '🧴',
      badge: 'Tough Stain Removal',
      eta: '15 mins',
      stock: 40,
      inStock: true,
      tags: ['surf excel', 'detergent', 'matic liquid', 'laundry', 'household', 'washing machine'],
      description: '1 cap of Surf Excel Matic Liquid equals 1 scoop of powder. Dissolves instantly in washing machines and removes tough stains without residue.',
      highlights: ['Designed for Top Load Machines', 'Fast dissolve action', 'Superior fragrance & color care', 'Economical 2L refill pack'],
      specifications: { 'Brand': 'Hindustan Unilever (Surf Excel)', 'Shelf Life': '24 Months', 'Packaging': 'Spout Pouch', 'Country of Origin': 'India', 'Storage': 'Keep out of reach of children.' },
      frequentlyBoughtWith: ['prod-037', 'prod-038'],
      galleryImages: ['🧴', '🧼', '🧹']
    },
    {
      id: 'prod-037',
      name: 'Lizol Citrus Floor Cleaner & Disinfectant',
      brand: 'Lizol',
      category: 'cleaning',
      subcategory: 'Floor Cleaners',
      weight: '2 L Economy Bottle',
      sellingPrice: 310,
      mrp: 380,
      discount: 18,
      rating: 4.8,
      reviewCount: 2750,
      emoji: '🧹',
      badge: '99.9% Germ Kill',
      eta: '15 mins',
      stock: 35,
      inStock: true,
      tags: ['lizol', 'floor cleaner', 'disinfectant', 'cleaning', 'household', 'citrus'],
      description: 'India\'s #1 floor cleaner providing 10x better germ kill than standard phenyls with a refreshing long-lasting citrus fragrance.',
      highlights: ['Kills 99.9% germs & COVID virus', '10x Better cleaning than phenyl', 'Leaves sparkling clean floors', 'Citrus fragrance'],
      specifications: { 'Brand': 'Reckitt Benckiser (Lizol)', 'Shelf Life': '24 Months', 'Packaging': 'Bottle', 'Country of Origin': 'India', 'Storage': 'Store upright.' },
      frequentlyBoughtWith: ['prod-036', 'prod-038'],
      galleryImages: ['🧹', '🧴', '🧼']
    },
    {
      id: 'prod-038',
      name: 'Vim Lemon Dishwash Liquid Gel',
      brand: 'Vim',
      category: 'cleaning',
      subcategory: 'Dishwash',
      weight: '750 ml Bottle with Scrub',
      sellingPrice: 145,
      mrp: 180,
      discount: 19,
      rating: 4.8,
      reviewCount: 3100,
      emoji: '🍋',
      badge: 'Degreaser',
      eta: '10 mins',
      stock: 50,
      inStock: true,
      tags: ['vim', 'dishwash', 'vim liquid', 'cleaning', 'dish soap', 'lemon'],
      description: 'Power of 100 lemons in 1 spoon! Cuts through stubborn grease, burnt oil, and tough food smells with zero scratches.',
      highlights: ['Concentrated Lemon Formula', 'Cuts tough burnt grease', 'Safe on non-stick cookware', 'Free Scrub sponge inside'],
      specifications: { 'Brand': 'Hindustan Unilever (Vim)', 'Shelf Life': '24 Months', 'Packaging': 'Bottle', 'Country of Origin': 'India', 'Storage': 'Keep bottle capped.' },
      frequentlyBoughtWith: ['prod-036', 'prod-037'],
      galleryImages: ['🍋', '🧼', '🧹']
    },
    {
      id: 'prod-039',
      name: 'Origami Soft 3-Ply Facial Tissues',
      brand: 'Origami',
      category: 'household',
      subcategory: 'Paper & Tissues',
      weight: 'Pack of 3 Boxes (300 pulls)',
      sellingPrice: 185,
      mrp: 240,
      discount: 23,
      rating: 4.7,
      reviewCount: 820,
      emoji: '🧻',
      badge: '3-Ply Ultra Soft',
      eta: '12 mins',
      stock: 30,
      inStock: true,
      tags: ['tissue', 'facial tissue', 'origami', 'paper tissue', 'household'],
      description: 'Ultra-absorbent 3-ply virgin pulp tissues that are gentle on facial skin and completely lint-free.',
      highlights: ['100% Virgin Pulp', '3-Ply Soft & Absorbent', 'Gentle on sensitive skin', 'Decorator tabletop box'],
      specifications: { 'Brand': 'Origami', 'Shelf Life': '36 Months', 'Packaging': 'Pack of 3 Boxes', 'Country of Origin': 'India', 'Storage': 'Store in dry place.' },
      frequentlyBoughtWith: ['prod-036', 'prod-031'],
      galleryImages: ['🧻', '🧴', '🧼']
    },

    // 13. BABY CARE
    {
      id: 'prod-040',
      name: 'Pampers All-Round Protection Pants (M)',
      brand: 'Pampers',
      category: 'baby-care',
      subcategory: 'Diapers & Wipes',
      weight: 'Medium (76 Diapers)',
      sellingPrice: 899,
      mrp: 1199,
      discount: 25,
      rating: 4.9,
      reviewCount: 2850,
      emoji: '👶',
      badge: '25% OFF',
      eta: '15 mins',
      stock: 20,
      inStock: true,
      tags: ['diaper', 'pampers', 'baby diaper', 'baby care', 'diaper pants'],
      description: 'Anti-rash blanket lotion with Aloe Vera and Magic Gel locks wetness for up to 12 hours of peaceful sleep.',
      highlights: ['Up to 12 Hours Absorption', 'Lotion with Aloe Vera', 'Ultra-soft flexible waistband', 'Wetness indicator'],
      specifications: { 'Brand': 'Procter & Gamble (Pampers)', 'Shelf Life': '36 Months', 'Packaging': 'Jumbo Pack', 'Country of Origin': 'India', 'Storage': 'Store in dry place.' },
      frequentlyBoughtWith: ['prod-041', 'prod-042'],
      galleryImages: ['👶', '🍼', '🧴']
    },
    {
      id: 'prod-041',
      name: 'Johnson\'s Baby No More Tears Shampoo',
      brand: 'Johnson\'s',
      category: 'baby-care',
      subcategory: 'Baby Bath',
      weight: '500 ml Pump Pack',
      sellingPrice: 345,
      mrp: 410,
      discount: 16,
      rating: 4.8,
      reviewCount: 1450,
      emoji: '🧴',
      badge: 'No More Tears',
      eta: '15 mins',
      stock: 25,
      inStock: true,
      tags: ['baby shampoo', 'johnsons baby', 'no more tears', 'baby bath', 'baby care'],
      description: 'As gentle to the eyes as pure water. Soap-free hypoallergenic formula cleans delicate baby scalp and hair gently.',
      highlights: ['Clinically proven mild', 'No parabens or sulfates', 'Gentle tear-free formula', 'Easy pump dispenser'],
      specifications: { 'Brand': 'Johnson & Johnson', 'Shelf Life': '36 Months', 'Packaging': 'Bottle', 'Country of Origin': 'India', 'Storage': 'Keep at room temp.' },
      frequentlyBoughtWith: ['prod-040', 'prod-042'],
      galleryImages: ['🧴', '👶', '🍼']
    },
    {
      id: 'prod-042',
      name: 'Himalaya Gentle Baby Wipes with Aloe',
      brand: 'Himalaya',
      category: 'baby-care',
      subcategory: 'Diapers & Wipes',
      weight: 'Pack of 2 (144 Wipes)',
      sellingPrice: 260,
      mrp: 320,
      discount: 19,
      rating: 4.8,
      reviewCount: 1100,
      emoji: '🧻',
      badge: 'Herbal Care',
      eta: '12 mins',
      stock: 30,
      inStock: true,
      tags: ['baby wipes', 'wipes', 'himalaya wipes', 'baby care', 'aloe wipes'],
      description: 'Enriched with Indian Lotus and Aloe Vera extracts to soothe and moisturize baby\'s delicate skin while cleaning.',
      highlights: ['Alcohol & Paraben free', 'Natural herbs infused', 'Thick and soft texture', 'Moisture-lock flip lid'],
      specifications: { 'Brand': 'Himalaya BabyCare', 'Shelf Life': '24 Months', 'Packaging': 'Twin Pack with Lid', 'Country of Origin': 'India', 'Storage': 'Close lid tightly.' },
      frequentlyBoughtWith: ['prod-040', 'prod-041'],
      galleryImages: ['🧻', '👶', '🧴']
    },

    // 14. TOYS, KIDS & GAMES
    {
      id: 'prod-043',
      name: 'Hot Wheels 5-Car Diecast Gift Pack',
      brand: 'Hot Wheels (Mattel)',
      category: 'toys-games',
      subcategory: 'Action & Vehicles',
      weight: 'Set of 5 Cars',
      sellingPrice: 475,
      mrp: 650,
      discount: 27,
      rating: 4.9,
      reviewCount: 1980,
      emoji: '🏎️',
      badge: 'Collector\'s Choice',
      eta: '15 mins',
      stock: 18,
      inStock: true,
      tags: ['hot wheels', 'cars', 'toy cars', 'mattel', 'kids toys', 'diecast'],
      description: 'Authentic 1:64 scale diecast metal cars with aerodynamic detailing, vibrant racing paint, and smooth rolling wheels.',
      highlights: ['1:64 Realistic Die-cast scale', '5 Themed high-speed cars', 'Durable metal & plastic build', 'Compatible with Hot Wheels tracks'],
      specifications: { 'Brand': 'Mattel Hot Wheels', 'Age Group': '3+ Years', 'Material': 'Die-Cast Metal & ABS', 'Packaging': 'Gift Window Box', 'Country of Origin': 'India / Malaysia' },
      frequentlyBoughtWith: ['prod-044', 'prod-045'],
      galleryImages: ['🏎️', '🧸', '🎮']
    },
    {
      id: 'prod-044',
      name: 'Play-Doh Fun Color Tub Modeling Clay',
      brand: 'Hasbro',
      category: 'toys-games',
      subcategory: 'Creative & Art',
      weight: 'Pack of 8 Vibrant Tubs',
      sellingPrice: 320,
      mrp: 420,
      discount: 24,
      rating: 4.8,
      reviewCount: 920,
      emoji: '🎨',
      badge: 'Non-Toxic',
      eta: '15 mins',
      stock: 22,
      inStock: true,
      tags: ['play doh', 'modeling clay', 'hasbro', 'kids toys', 'creative toys', 'art'],
      description: 'Squishy, moldable non-toxic classic Play-Doh modeling compound in 8 bright assorted colors for limitless creative fun.',
      highlights: ['100% Non-Toxic formula', '8 Bright assorted colors', 'Soft and easy to mold', 'Reusable airtight tubs'],
      specifications: { 'Brand': 'Hasbro Play-Doh', 'Age Group': '2+ Years', 'Material': 'Flour, Water, Salt Compound', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-043', 'prod-045'],
      galleryImages: ['🎨', '🧸', '🏎️']
    },
    {
      id: 'prod-045',
      name: 'Monopoly Classic Board Game for Family',
      brand: 'Hasbro Gaming',
      category: 'toys-games',
      subcategory: 'Board Games',
      weight: '1 Box Game',
      sellingPrice: 699,
      mrp: 999,
      discount: 30,
      rating: 4.9,
      reviewCount: 1600,
      emoji: '🎲',
      badge: '30% OFF',
      eta: '20 mins',
      stock: 15,
      inStock: true,
      tags: ['monopoly', 'board game', 'hasbro', 'family game', 'toys', 'indoor game'],
      description: 'The world\'s favorite fast-dealing property trading game! Buy, sell, dream and scheme your way to riches.',
      highlights: ['Classic Indian Cities Board', 'Diecast metal playing tokens', '2 to 6 players fun', 'Develops strategic thinking'],
      specifications: { 'Brand': 'Hasbro Gaming', 'Age Group': '8+ Years', 'Packaging': 'Large Board Box', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-043', 'prod-044'],
      galleryImages: ['🎲', '🧸', '🎨']
    },

    // 15. STATIONERY & OFFICE
    {
      id: 'prod-046',
      name: 'Classmate Pulse 6-Subject Spiral Notebook',
      brand: 'Classmate (ITC)',
      category: 'stationery',
      subcategory: 'Notebooks',
      weight: '300 Pages (A4 Size)',
      sellingPrice: 175,
      mrp: 210,
      discount: 17,
      rating: 4.8,
      reviewCount: 840,
      emoji: '📓',
      badge: 'Ozone Treated',
      eta: '12 mins',
      stock: 35,
      inStock: true,
      tags: ['notebook', 'classmate', 'spiral notebook', 'stationery', 'office', 'register'],
      description: 'High-opacity bright white ozone-treated paper with durable spiral binding and movable subject partition sheets.',
      highlights: ['Ultra-white 70 GSM paper', 'Multi-subject divider tabs', 'Durable poly cover', 'Smooth pen writing glide'],
      specifications: { 'Brand': 'ITC Classmate', 'Paper Size': 'A4', 'Page Count': '300 Pages', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-047', 'prod-048'],
      galleryImages: ['📓', '✏️', '🖋️']
    },
    {
      id: 'prod-047',
      name: 'Parker Vector Matte Black Fountain Pen',
      brand: 'Parker',
      category: 'stationery',
      subcategory: 'Pens & Writing',
      weight: '1 Pen + 2 Cartridges',
      sellingPrice: 380,
      mrp: 450,
      discount: 16,
      rating: 4.7,
      reviewCount: 620,
      emoji: '🖋️',
      badge: 'Executive',
      eta: '15 mins',
      stock: 20,
      inStock: true,
      tags: ['pen', 'parker', 'fountain pen', 'stationery', 'luxury pen', 'vector'],
      description: 'Iconic Parker Vector fountain pen featuring matte epoxy resin barrel, stainless steel nib, and smooth ink flow.',
      highlights: ['Stainless steel fine nib', 'Matte black resin body', 'Refillable ink converter included', '2 Year Warranty'],
      specifications: { 'Brand': 'Parker', 'Ink Color': 'Blue', 'Packaging': 'Gift Box', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-046', 'prod-048'],
      galleryImages: ['🖋️', '📓', '✏️']
    },

    // 16. HOME & KITCHEN
    {
      id: 'prod-048',
      name: 'Milton Thermosteel Flip Lid Vacuum Flask',
      brand: 'Milton',
      category: 'home-kitchen',
      subcategory: 'Bottles & Flasks',
      weight: '1000 ml',
      sellingPrice: 820,
      mrp: 1060,
      discount: 23,
      rating: 4.9,
      reviewCount: 1850,
      emoji: '🍶',
      badge: '24h Hot / Cold',
      eta: '20 mins',
      stock: 16,
      inStock: true,
      tags: ['flask', 'milton', 'water bottle', 'thermosteel', 'home kitchen', 'hot cold bottle'],
      description: 'Double-walled vacuum insulated 304 grade stainless steel flask that keeps beverages hot or cold for a full 24 hours.',
      highlights: ['24 Hours Temperature Retention', '100% Rust-proof 304 Steel', 'Leak-proof flip lid', 'Fabric carrying pouch included'],
      specifications: { 'Brand': 'Milton', 'Capacity': '1000 ml', 'Material': 'SS 304 Steel', 'Warranty': '1 Year Milton Warranty', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-046', 'prod-049'],
      galleryImages: ['🍶', '🏠', '🍳']
    },
    {
      id: 'prod-049',
      name: 'Prestige Omega Deluxe Granite Fry Pan',
      brand: 'Prestige',
      category: 'home-kitchen',
      subcategory: 'Cookware',
      weight: '24 cm Diameter',
      sellingPrice: 799,
      mrp: 1195,
      discount: 33,
      rating: 4.8,
      reviewCount: 1320,
      emoji: '🍳',
      badge: '33% OFF',
      eta: '20 mins',
      stock: 14,
      inStock: true,
      tags: ['pan', 'prestige', 'fry pan', 'non stick', 'cookware', 'kitchen'],
      description: 'Durable 5-layer German non-stick granite coating compatible with both gas stoves and induction cooktops.',
      highlights: ['5-Layer Granite Non-Stick Coating', 'Induction & Gas Compatible', 'PFOA Free & Metal Spoon friendly', 'Stay-cool ergonomic handle'],
      specifications: { 'Brand': 'TTK Prestige', 'Diameter': '24 cm', 'Warranty': '2 Years', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-010', 'prod-011'],
      galleryImages: ['🍳', '🏠', '🍶']
    },

    // 17. ELECTRONICS & GADGETS
    {
      id: 'prod-050',
      name: 'boAt Rockerz 255 Pro+ Wireless Neckband',
      brand: 'boAt',
      category: 'electronics',
      subcategory: 'Audio',
      weight: 'Active Black',
      sellingPrice: 1199,
      mrp: 3990,
      discount: 70,
      rating: 4.8,
      reviewCount: 6500,
      emoji: '🎧',
      badge: '70% OFF',
      eta: '20 mins',
      stock: 25,
      inStock: true,
      tags: ['boat', 'earphones', 'bluetooth', 'neckband', 'electronics', 'rockerz', 'audio'],
      description: 'Monster 60-hour playtime bluetooth earphones with ASAP fast charge (10 min charge = 10 hours playback) and boAt Signature Sound.',
      highlights: ['60 Hours Massive Battery Playtime', 'ASAP Fast Charge Technology', 'IPX7 Water & Sweat Resistance', '10mm Dynamic Bass Drivers'],
      specifications: { 'Brand': 'boAt Lifestyle', 'Bluetooth': 'v5.2', 'Warranty': '1 Year Brand Warranty', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-051', 'prod-052'],
      galleryImages: ['🎧', '📱', '🔌']
    },
    {
      id: 'prod-051',
      name: 'Mi 10000mAh Fast Charging Power Bank 3i',
      brand: 'Xiaomi (Mi)',
      category: 'electronics',
      subcategory: 'Power & Accessories',
      weight: 'Metallic Black',
      sellingPrice: 999,
      mrp: 1499,
      discount: 33,
      rating: 4.8,
      reviewCount: 4200,
      emoji: '🔋',
      badge: '18W Fast Charge',
      eta: '20 mins',
      stock: 20,
      inStock: true,
      tags: ['powerbank', 'mi powerbank', 'xiaomi', 'electronics', 'battery', 'charger'],
      description: 'Dual input and dual output 18W high-speed charging power bank with high density lithium polymer cells and 12-layer circuit protection.',
      highlights: ['18W Fast Two-Way Charging', 'Dual USB Output + Type-C Input', '12-Layer Advanced Circuit Protection', 'Smart Low-Current Charging Mode'],
      specifications: { 'Brand': 'Xiaomi Mi', 'Capacity': '10000 mAh', 'Output Ports': '2x USB-A + 1x Type-C', 'Warranty': '6 Months', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-050', 'prod-052'],
      galleryImages: ['🔋', '📱', '🎧']
    },
    {
      id: 'prod-052',
      name: 'Duracell Ultra Alkaline AA Batteries',
      brand: 'Duracell',
      category: 'electronics',
      subcategory: 'Batteries',
      weight: 'Pack of 8 Batteries',
      sellingPrice: 340,
      mrp: 400,
      discount: 15,
      rating: 4.9,
      reviewCount: 1890,
      emoji: '🔋',
      badge: '100% Extra Life',
      eta: '10 mins',
      stock: 50,
      inStock: true,
      tags: ['duracell', 'battery', 'aa battery', 'electronics', 'alkaline'],
      description: 'Up to 100% extra life powercheck technology batteries for remote controls, digital toys, mouse, and clocks.',
      highlights: ['PowerCheck power indicator built-in', 'Leakage prevention technology', 'Guaranteed 10-year shelf life', 'High energy density'],
      specifications: { 'Brand': 'Duracell', 'Type': 'Alkaline AA (1.5V)', 'Packaging': 'Pack of 8', 'Country of Origin': 'Belgium / India' },
      frequentlyBoughtWith: ['prod-043', 'prod-050'],
      galleryImages: ['🔋', '🏎️', '📱']
    },

    // 18. PET CARE
    {
      id: 'prod-053',
      name: 'Pedigree Adult Complete Dog Food Chicken & Veg',
      brand: 'Pedigree',
      category: 'pet-care',
      subcategory: 'Dog Food',
      weight: '3 kg Bag',
      sellingPrice: 685,
      mrp: 810,
      discount: 15,
      rating: 4.8,
      reviewCount: 1720,
      emoji: '🐶',
      badge: 'Vet Recommended',
      eta: '15 mins',
      stock: 22,
      inStock: true,
      tags: ['dog food', 'pedigree', 'pet food', 'pet care', 'canine nutrition'],
      description: 'Wholesome balanced dry dog food providing 5 signs of good health: healthy skin, strong teeth, immune defense, and digestion.',
      highlights: ['Real Chicken & Rice recipe', 'Omega 6 & Zinc for shiny coat', 'High Protein & Prebiotics', 'Developed with Waltham Vets'],
      specifications: { 'Brand': 'Mars Petcare (Pedigree)', 'Shelf Life': '12 Months', 'Packaging': 'Bag', 'Country of Origin': 'India' },
      frequentlyBoughtWith: ['prod-054', 'prod-037'],
      galleryImages: ['🐶', '🥣', '🍖']
    },
    {
      id: 'prod-054',
      name: 'Whiskas Adult Wet Cat Food Ocean Fish Gravy',
      brand: 'Whiskas',
      category: 'pet-care',
      subcategory: 'Cat Food',
      weight: 'Pack of 12 (85g each)',
      sellingPrice: 480,
      mrp: 540,
      discount: 11,
      rating: 4.9,
      reviewCount: 980,
      emoji: '🐱',
      badge: 'Real Fish',
      eta: '15 mins',
      stock: 25,
      inStock: true,
      tags: ['cat food', 'whiskas', 'pet care', 'wet cat food', 'fish gravy'],
      description: 'Succulent chunks of real ocean fish in mouth-watering savory gravy with essential Taurine, Vitamin A, and Zinc for healthy cats.',
      highlights: ['Real Ocean Fish Chunks in Gravy', 'Essential Taurine for clear vision', 'Supports urinary tract health', 'Single serve pouch packs'],
      specifications: { 'Brand': 'Mars Petcare (Whiskas)', 'Shelf Life': '24 Months', 'Packaging': 'Multipack Pouches', 'Country of Origin': 'India / Thailand' },
      frequentlyBoughtWith: ['prod-053', 'prod-037'],
      galleryImages: ['🐱', '🐟', '🥣']
    }
  ];

  // Helper method: Simulate realistic network delay
  function delay(ms = 40) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function mapBackendProduct(p) {
    if (!p) return null;
    const numId = typeof p.id === 'number' ? p.id : (typeof p.id === 'string' && p.id.startsWith('prod-') ? parseInt(p.id.replace('prod-', ''), 10) : (Number(p.id) || 1));
    const price = Number(p.sellingPrice || p.price || 0);
    const mrp = Number(p.mrp || price);
    const discount = p.discount !== undefined ? Number(p.discount) : (p.discount_percentage !== undefined ? Number(p.discount_percentage) : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0));
    const imageUrl = (p.images && p.images[0]) ? p.images[0].image_url : (p.image_url || null);

    let highlights = [];
    if (p.highlights) {
      try {
        highlights = typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights;
      } catch (e) {
        highlights = [p.highlights];
      }
    }
    let specifications = {};
    if (p.specifications) {
      try {
        specifications = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
      } catch (e) {
        specifications = {};
      }
    }
    let tags = [];
    if (p.tags) {
      tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()) : []);
    }

    return {
      id: numId,
      sku: p.sku || `SKU-${numId}`,
      name: p.name || 'Product',
      slug: p.slug || '',
      brand: p.brand || 'Big Basket',
      category: p.category_slug || (p.category ? (typeof p.category === 'string' ? p.category : p.category.slug) : '') || String(p.category_id || ''),
      category_id: Number(p.category_id || 0),
      subcategory: p.subcategory || p.subcategory_name || '',
      weight: p.weight || '',
      price: price,
      sellingPrice: price,
      mrp: mrp,
      discount: discount,
      rating: Number(p.rating || 4.5),
      reviewCount: Number(p.reviewCount || p.review_count || 120),
      emoji: p.emoji || '📦',
      badge: p.badge || (p.is_featured ? 'Featured' : null),
      eta: p.eta || '10–15 mins',
      stock: Number(p.stock !== undefined ? p.stock : (p.stock_quantity !== undefined ? p.stock_quantity : 50)),
      inStock: p.is_active !== false && Number(p.stock !== undefined ? p.stock : (p.stock_quantity !== undefined ? p.stock_quantity : 50)) > 0,
      tags: tags,
      description: p.description || '',
      shortDescription: p.shortDescription || p.short_description || '',
      highlights: highlights,
      specifications: specifications,
      image_url: imageUrl,
      images: p.images || (imageUrl ? [{ image_url: imageUrl }] : []),
      galleryImages: (p.images && p.images.length > 0) ? p.images.map(img => img.image_url) : (p.galleryImages || [p.emoji || '📦'])
    };
  }

  const apiHost = (window.location.hostname && window.location.hostname !== '') ? window.location.hostname : '127.0.0.1';
  const BASE_URL = (window.location.port === '8000')
    ? `${window.location.protocol}//${window.location.host}/api`
    : `http://${apiHost}:8000/api`;

  return {
    /**
     * Get all product categories
     */
    async getCategories() {
      try {
        const res = await fetch(`${BASE_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon || '🏷️',
              colorClass: `cat-${c.slug}`,
              discount: c.discount_label || 'Special Deals',
              parent_id: c.parent_id,
              is_active: c.is_active
            }));
          }
        }
      } catch (e) {
        console.warn('Backend getCategories fallback:', e);
      }
      await delay(20);
      return [...CATEGORIES];
    },

    /**
     * Get all unique brands available, optionally filtered by category
     */
    async getBrands(categoryId = null) {
      try {
        const q = (categoryId && categoryId !== 'all') ? `?category=${encodeURIComponent(categoryId)}` : '';
        const res = await fetch(`${BASE_URL}/products/brands${q}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data;
          }
        }
      } catch (e) {
        // fallback
      }
      await delay(20);
      let list = PRODUCTS;
      if (categoryId && categoryId !== 'all') {
        list = list.filter(p => p.category === categoryId || String(p.category_id) === String(categoryId));
      }
      return Array.from(new Set(list.map(p => p.brand))).filter(Boolean).sort();
    },

    /**
     * Get Search Suggestions (Autocomplete)
     */
    async getSearchSuggestions(query) {
      if (!query || query.trim() === '') {
        return { query: '', products: [], categories: [], brands: [], popular_tags: [] };
      }
      const clean = query.trim();
      try {
        const res = await fetch(`${BASE_URL}/products/suggestions?q=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Suggestions fallback:', e);
      }

      // Offline fallback
      await delay(20);
      const lower = clean.toLowerCase();
      const matchedProds = PRODUCTS.map(mapBackendProduct).filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(lower)))
      ).slice(0, 6);

      return {
        query: clean,
        products: matchedProds.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          emoji: p.emoji || '📦',
          image_url: p.image_url || null,
          selling_price: p.sellingPrice,
          mrp: p.mrp,
          weight: p.weight,
          category_name: p.category
        })),
        categories: CATEGORIES.filter(c => c.name.toLowerCase().includes(lower)).map(c => c.name).slice(0, 4),
        brands: Array.from(new Set(PRODUCTS.filter(p => p.brand.toLowerCase().includes(lower)).map(p => p.brand))).slice(0, 4),
        popular_tags: ['Milk', 'Atta 5kg', 'Amul Butter', 'Cadbury Silk', 'Tomatoes', 'Maggi']
      };
    },

    /**
     * Advanced Catalog Query with Filtering, Sorting, Searching & Pagination
     */
    async getProducts(params = {}) {
      const {
        category = null,
        subcategory = null,
        brand = null,
        brands = [],
        search = '',
        minPrice = 0,
        maxPrice = 10000,
        rating = 0,
        discount = 0,
        inStockOnly = false,
        availability = null,
        sort = 'relevance',
        page = 1,
        limit = 24
      } = params;

      try {
        const qParams = new URLSearchParams();
        if (category && category !== 'all') qParams.append('category', category);
        if (subcategory && subcategory !== 'all') qParams.append('subcategory', subcategory);
        if (brands && brands.length > 0) {
          qParams.append('brand', brands.join(','));
        } else if (brand && brand !== 'all') {
          qParams.append('brand', brand);
        }
        if (search && search.trim()) qParams.append('search', search.trim());
        if (minPrice > 0) qParams.append('min_price', minPrice);
        if (maxPrice < 10000) qParams.append('max_price', maxPrice);
        if (rating > 0) qParams.append('min_rating', rating);
        if (discount > 0) qParams.append('discount', discount);
        if (availability) {
          qParams.append('availability', availability);
        } else if (inStockOnly) {
          qParams.append('availability', 'in_stock');
        }
        if (sort) qParams.append('sort', sort);
        qParams.append('page', page);
        qParams.append('limit', limit);

        const res = await fetch(`${BASE_URL}/products?${qParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data && Array.isArray(json.data.items)) {
            const mapped = json.data.items.map(mapBackendProduct);
            const pag = json.data.pagination || {};
            return {
              products: mapped,
              totalCount: pag.total_count !== undefined ? pag.total_count : mapped.length,
              page: pag.page || page,
              limit: pag.limit || limit,
              hasMore: pag.has_next !== undefined ? pag.has_next : false,
              totalPages: pag.total_pages || Math.ceil(mapped.length / limit)
            };
          }
        }
      } catch (e) {
        console.warn('Backend getProducts fallback:', e);
      }

      await delay(20);
      let filtered = PRODUCTS.map(mapBackendProduct);

      // 1. Filter by Category
      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase() || String(p.category_id) === String(category));
      }

      // 2. Filter by Brand(s)
      const activeBrands = brands.length > 0 ? brands : (brand ? [brand] : []);
      if (activeBrands.length > 0) {
        const lowerBrands = activeBrands.map(b => b.toLowerCase());
        filtered = filtered.filter(p => lowerBrands.includes(p.brand.toLowerCase()));
      }

      // 3. Search Query Filter (Name, Brand, Category, Subcategory, Tags)
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
      }

      // 4. Filter by Price Range
      filtered = filtered.filter(p => p.sellingPrice >= minPrice && p.sellingPrice <= maxPrice);

      // 5. Filter by Minimum Rating
      if (rating > 0) {
        filtered = filtered.filter(p => p.rating >= rating);
      }

      // 6. Filter by Minimum Discount
      if (discount > 0) {
        filtered = filtered.filter(p => p.discount >= discount);
      }

      // 7. Filter by Stock Availability
      if (inStockOnly) {
        filtered = filtered.filter(p => p.inStock && p.stock > 0);
      }

      // 8. Sorting
      switch (sort) {
        case 'price-low':
          filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
          break;
        case 'discount':
          filtered.sort((a, b) => b.discount - a.discount);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating || (b.reviewCount || 0) - (a.reviewCount || 0));
          break;
        case 'newest':
          filtered.sort((a, b) => b.id - a.id);
          break;
        case 'relevance':
        default:
          break;
      }

      // 9. Pagination
      const totalCount = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < totalCount;

      return {
        products: paginatedItems,
        totalCount,
        page,
        limit,
        hasMore,
        totalPages: Math.ceil(totalCount / limit)
      };
    },

    /**
     * Get single product by ID with full details
     */
    async getProduct(productId) {
      if (!productId) throw new Error('Product ID required');
      const cleanId = String(productId).replace(/^prod-0*/, '');
      const numId = Number(cleanId || productId);

      try {
        const res = await fetch(`${BASE_URL}/products/${numId || productId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            return mapBackendProduct(json.data);
          }
        }
      } catch (e) {
        console.warn('Backend getProduct fallback:', e);
      }

      await delay(20);
      const product = PRODUCTS.map(mapBackendProduct).find(p => String(p.id) === String(productId) || String(p.id) === String(numId));
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      return product;
    },

    /**
     * Get Related Products ("You May Also Like")
     */
    async getRelatedProducts(productId, limit = 6) {
      await delay(20);
      const all = PRODUCTS.map(mapBackendProduct);
      const current = all.find(p => String(p.id) === String(productId));
      if (!current) return all.slice(0, limit);

      const related = all.filter(p => String(p.id) !== String(productId) && (
        p.category === current.category ||
        p.brand === current.brand ||
        (p.tags && p.tags.some(t => current.tags.includes(t)))
      ));

      return (related.length >= limit ? related : [...related, ...all.filter(p => String(p.id) !== String(productId))]).slice(0, limit);
    },

    /**
     * Get Frequently Bought Together bundle items
     */
    async getFrequentlyBought(productId) {
      await delay(20);
      const all = PRODUCTS.map(mapBackendProduct);
      const current = all.find(p => String(p.id) === String(productId));
      if (!current) return [];

      let fallbacks = all.filter(p => String(p.id) !== String(productId) && (p.category === current.category || p.category === 'dairy-breakfast' || p.category === 'bakery'));
      return [current, ...fallbacks.slice(0, 2)];
    },

    /**
     * Search products by keyword query (for live dropdown autocomplete)
     */
    async searchProducts(query) {
      if (!query || query.trim() === '') return [];
      const clean = query.trim();
      try {
        const res = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data)) {
            return json.data.map(mapBackendProduct);
          }
        }
      } catch (e) {
        // fallback
      }
      await delay(20);
      const lower = clean.toLowerCase();
      return PRODUCTS.map(mapBackendProduct).filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(lower)))
      ).slice(0, 8);
    },

    /**
     * Get curated sections for homepage
     */
    async getFeaturedSections() {
      try {
        const res = await fetch(`${BASE_URL}/products?limit=50`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data && Array.isArray(json.data.items)) {
            const all = json.data.items.map(mapBackendProduct);
            return {
              bestSellers: all.filter(p => p.badge && p.badge.toLowerCase().includes('bestseller') || p.rating >= 4.8).slice(0, 8),
              freshGrocery: all.filter(p => p.category === 'fruits-vegetables' || p.category === 'atta-rice-dal' || p.category === 'oil-ghee' || [1, 2, 11].includes(p.category_id)).slice(0, 8),
              snacksChocolates: all.filter(p => p.category === 'chocolates' || p.category === 'biscuits' || p.category === 'snacks' || [5, 6, 7].includes(p.category_id)).slice(0, 8),
              toysKids: all.filter(p => p.category === 'toys-games' || p.category === 'baby-care' || [16, 17].includes(p.category_id)).slice(0, 8),
              householdEssentials: all.filter(p => p.category === 'household' || p.category === 'cleaning' || p.category === 'personal-care' || [12, 14, 15].includes(p.category_id)).slice(0, 8)
            };
          }
        }
      } catch (e) {
        // fallback
      }
      await delay(20);
      const all = PRODUCTS.map(mapBackendProduct);
      return {
        bestSellers: all.filter(p => p.badge && p.badge.toLowerCase().includes('bestseller') || p.rating >= 4.8).slice(0, 8),
        freshGrocery: all.filter(p => p.category === 'fruits-vegetables' || p.category === 'atta-rice-dal' || p.category === 'oil-ghee').slice(0, 8),
        snacksChocolates: all.filter(p => p.category === 'chocolates' || p.category === 'biscuits' || p.category === 'snacks').slice(0, 8),
        toysKids: all.filter(p => p.category === 'toys-games' || p.category === 'baby-care').slice(0, 8),
        householdEssentials: all.filter(p => p.category === 'household' || p.category === 'cleaning' || p.category === 'personal-care').slice(0, 8)
      };
    },

    /**
     * =========================================================================
     * FASTAPI PYTHON BACKEND BRIDGE & INTEGRATION LAYER
     * =========================================================================
     */
    API_BASE_URL: BASE_URL,

    /**
     * Get or override the backend API base URL
     */
    getBaseUrl() {
      return this.API_BASE_URL;
    },

    setBaseUrl(url) {
      this.API_BASE_URL = url;
    },

    /**
     * Check if FastAPI backend server is alive
     */
    async isBackendOnline() {
      try {
        const res = await fetch(`${this.API_BASE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(1500)
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    },

    /**
     * Authenticated HTTP Fetch helper with Bearer token
     */
    async fetchWithAuth(endpoint, options = {}) {
      const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      return data;
    },

    /**
     * CUSTOMER AUTH & ACCOUNT API METHODS (FastAPI Integration Layer)
     */
    async login(identifier, password, remember = true) {
      try {
        const res = await fetch(`${this.API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, remember_me: remember }),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const token = json.data.access_token;
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('bigbasket_auth_token', token);
            storage.setItem('bigbasket_user', JSON.stringify(json.data.user));
            return { success: true, user: json.data.user, token };
          }
        }
      } catch (e) {
        console.warn('Backend server offline, using client auth fallback:', e.message);
      }

      // Fallback to client-side auth module
      if (window.BigBasketAuth) {
        return window.BigBasketAuth.loginUser(identifier, password, remember);
      }
      return { success: false, message: 'Auth module not loaded' };
    },

    async register(name, mobile, email, password) {
      try {
        const res = await fetch(`${this.API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: name, phone: mobile, email, password }),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const token = json.data.access_token;
            localStorage.setItem('bigbasket_auth_token', token);
            localStorage.setItem('bigbasket_user', JSON.stringify(json.data.user));
            return { success: true, user: json.data.user, token };
          }
        } else {
          const errJson = await res.json();
          return { success: false, message: errJson.error?.message || 'Registration failed' };
        }
      } catch (e) {
        console.warn('Backend server offline, using client auth fallback:', e.message);
      }

      // Fallback to client-side auth module
      if (window.BigBasketAuth) {
        return window.BigBasketAuth.registerUser(name, mobile, email, password);
      }
      return { success: false, message: 'Auth module not loaded' };
    },

    async logout() {
      localStorage.removeItem('bigbasket_auth_token');
      sessionStorage.removeItem('bigbasket_auth_token');
      if (window.BigBasketAuth) {
        return window.BigBasketAuth.logoutUser();
      }
      return true;
    },

    async getProfile() {
      try {
        const res = await this.fetchWithAuth('/auth/me');
        if (res && res.success && res.data) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAuth) {
        return window.BigBasketAuth.getCurrentUser();
      }
      return null;
    },

    async updateProfile(name, email) {
      try {
        const res = await this.fetchWithAuth('/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ full_name: name, email })
        });
        if (res && res.success) {
          return { success: true, user: res.data };
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAuth) {
        return window.BigBasketAuth.updateProfile(name, email);
      }
      return { success: false, message: 'Auth module not loaded' };
    },

    async getAddresses() {
      try {
        const res = await this.fetchWithAuth('/addresses');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAddresses) {
        return window.BigBasketAddresses.getAddresses();
      }
      return [];
    },

    async addAddress(addressData) {
      try {
        const res = await this.fetchWithAuth('/addresses', {
          method: 'POST',
          body: JSON.stringify(addressData)
        });
        if (res && res.success) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAddresses) {
        return window.BigBasketAddresses.addAddress(addressData);
      }
      return null;
    },

    async updateAddress(id, addressData) {
      try {
        const res = await this.fetchWithAuth(`/addresses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(addressData)
        });
        if (res && res.success) {
          return true;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAddresses) {
        return window.BigBasketAddresses.updateAddress(id, addressData);
      }
      return false;
    },

    async deleteAddress(id) {
      try {
        const res = await this.fetchWithAuth(`/addresses/${id}`, {
          method: 'DELETE'
        });
        if (res && res.success) {
          return true;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketAddresses) {
        return window.BigBasketAddresses.deleteAddress(id);
      }
      return false;
    },

    async getOrders() {
      try {
        const res = await this.fetchWithAuth('/orders');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketOrders) {
        return window.BigBasketOrders.getOrders();
      }
      return [];
    },

    async getOrder(orderId) {
      try {
        const res = await this.fetchWithAuth(`/orders/${orderId}`);
        if (res && res.success && res.data) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketOrders) {
        return window.BigBasketOrders.getOrder(orderId);
      }
      return null;
    },

    async getWishlist() {
      try {
        const res = await this.fetchWithAuth('/wishlist');
        if (res && res.success && Array.isArray(res.data)) {
          return res.data.map(item => item.product_id);
        }
      } catch (e) {
        // fallback
      }
      if (window.BigBasketWishlist) {
        return window.BigBasketWishlist.getItems();
      }
      return [];
    },

    // Master Prompt 4 & 6: Cart APIs
    async getCart() {
      try {
        const res = await this.fetchWithAuth('/cart');
        if (res && res.success) return res;
      } catch (e) {
        console.warn('Backend getCart fallback:', e);
      }
      return null;
    },

    async addCartItem(productId, quantity = 1) {
      try {
        const res = await this.fetchWithAuth('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ product_id: Number(productId), quantity: Number(quantity) })
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn('Backend addCartItem error:', e);
      }
      return null;
    },

    async updateCartItem(itemId, quantity) {
      try {
        const res = await this.fetchWithAuth(`/cart/items/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: Number(quantity) })
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn('Backend updateCartItem error:', e);
      }
      return null;
    },

    async removeCartItem(itemId) {
      try {
        const res = await this.fetchWithAuth(`/cart/items/${itemId}`, {
          method: 'DELETE'
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn('Backend removeCartItem error:', e);
      }
      return null;
    },

    async clearCart() {
      try {
        const res = await this.fetchWithAuth('/cart', {
          method: 'DELETE'
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn('Backend clearCart error:', e);
      }
      return null;
    },

    // Master Prompt 6: Checkout, Delivery, Coupons & Orders
    async getCheckoutSummary(payload = {}) {
      try {
        const res = await this.fetchWithAuth('/checkout/summary', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res && res.success && res.data) return res;
      } catch (e) {
        console.warn('Backend summary fallback:', e);
      }

      // Offline client fallback calculator
      const cartItems = (window.BigBasketCart && typeof window.BigBasketCart.getItems === 'function')
        ? window.BigBasketCart.getItems()
        : [];

      let subtotal = 0;
      const itemsSummary = cartItems.map(it => {
        const itemPrice = Number(it.price || it.sellingPrice || 0);
        const lineTotal = itemPrice * (Number(it.quantity) || 1);
        subtotal += lineTotal;
        return {
          product_id: it.id,
          product_name: it.name,
          product_brand: it.brand || 'Big Basket',
          product_weight: it.weight || '',
          emoji: it.emoji || '📦',
          image_url: it.image_url || null,
          quantity: Number(it.quantity) || 1,
          unit_price: itemPrice.toFixed(2),
          total_price: lineTotal.toFixed(2),
          in_stock: true
        };
      });

      let discount = 0;
      let couponCode = payload.coupon_code;
      if (couponCode === 'WELCOME20' && subtotal >= 299) {
        discount = Math.min(Math.round(subtotal * 0.20), 100);
      } else if (couponCode === 'FREEDEL' && subtotal >= 199) {
        discount = 30;
      } else if (couponCode === 'BIGBASKET50' && subtotal >= 499) {
        discount = 50;
      }

      const freeThresh = 299;
      const isFree = subtotal >= freeThresh || subtotal === 0;
      const deliveryFee = isFree ? 0 : 30;
      const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

      return {
        success: true,
        data: {
          items: itemsSummary,
          items_count: itemsSummary.length,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          delivery_fee: deliveryFee.toFixed(2),
          total_amount: totalAmount.toFixed(2),
          coupon_code: discount > 0 ? couponCode : null,
          free_delivery_threshold: freeThresh.toFixed(2),
          is_free_delivery: isFree,
          amount_needed_for_free_delivery: Math.max(0, freeThresh - subtotal).toFixed(2),
          delivery_available: true,
          delivery_zone_name: 'Satnali Local Core',
          estimated_delivery: '15–30 minutes',
          minimum_order: '99.00',
          meets_minimum_order: subtotal >= 99 || subtotal === 0,
          amount_needed_for_min_order: Math.max(0, 99 - subtotal).toFixed(2),
          cod_available: true,
          has_out_of_stock_items: false,
          stock_warning: null
        }
      };
    },

    async checkDelivery(pincode) {
      try {
        const res = await this.fetchWithAuth(`/delivery/check?pincode=${encodeURIComponent(pincode)}`);
        if (res && res.success) return res;
      } catch (e) {
        // fallback
      }
      const isSatnali = ['123024', '123025', '123029'].includes(pincode.trim());
      return {
        success: true,
        data: {
          available: isSatnali,
          zone: isSatnali ? 'Satnali Local Core' : null,
          delivery_fee: '30.00',
          free_delivery_threshold: '499.00',
          minimum_order: '99.00',
          estimated_delivery: '15–30 minutes',
          message: isSatnali ? null : 'Delivery unavailable in this area.'
        }
      };
    },

    async applyCoupon(couponCode) {
      try {
        const res = await this.fetchWithAuth('/checkout/apply-coupon', {
          method: 'POST',
          body: JSON.stringify({ coupon_code: couponCode })
        });
        if (res && res.success) return res;
      } catch (e) {
        // fallback
      }
      const code = couponCode.toUpperCase();
      if (code === 'WELCOME20') {
        return {
          success: true,
          data: { valid: true, coupon_code: 'WELCOME20', discount_type: 'percentage', discount_value: '20.00', discount_amount: '20.00', message: 'Flat 20% OFF applied!' }
        };
      } else if (code === 'FREEDEL') {
        return {
          success: true,
          data: { valid: true, coupon_code: 'FREEDEL', discount_type: 'fixed', discount_value: '30.00', discount_amount: '30.00', message: 'Free delivery coupon applied!' }
        };
      }
      return {
        success: false,
        message: `Coupon code '${couponCode}' is invalid or expired.`
      };
    },

    async createOrder(payload) {
      try {
        const res = await this.fetchWithAuth('/orders', {
          method: 'POST',
          headers: payload.idempotency_key ? { 'Idempotency-Key': payload.idempotency_key } : {},
          body: JSON.stringify(payload)
        });
        if (res && res.success) {
          if (window.BigBasketCart) window.BigBasketCart.clear();
          return res;
        }
        return res || { success: false, message: 'Failed to place order.' };
      } catch (e) {
        console.error('Order placement API error:', e);
        return {
          success: false,
          message: e.message || 'Failed to place order. Please check stock and try again.'
        };
      }
    },

    async cancelOrder(orderId) {
      try {
        const res = await this.fetchWithAuth(`/orders/${orderId}/cancel`, {
          method: 'POST'
        });
        if (res && res.success) return res;
      } catch (e) {
        // fallback
      }
      return {
        success: true,
        message: 'Order cancelled successfully.'
      };
    },

    async getAddresses() {
      try {
        const res = await this.fetchWithAuth('/addresses');
        if (res && res.success && Array.isArray(res.data)) return res;
      } catch (e) {
        console.warn('getAddresses backend fallback:', e);
      }

      return {
        success: true,
        data: [
          {
            id: 1,
            full_name: 'Abhishek Sharma',
            phone: '9876543210',
            address_line1: 'House #42, Near Old Bus Stand, Main Market',
            address_line2: '',
            city: 'Satnali',
            state: 'Haryana',
            pincode: '123024',
            address_type: 'home',
            is_default: true
          }
        ]
      };
    },

    async saveAddress(addr) {
      const payload = {
        full_name: (addr.full_name || addr.name || '').trim(),
        phone: (addr.phone || addr.mobile || '').trim(),
        address_line1: (addr.address_line1 || addr.house || '').trim(),
        address_line2: (addr.address_line2 || addr.street || '').trim(),
        landmark: (addr.landmark || '').trim() || null,
        city: (addr.city || 'Satnali').trim(),
        state: (addr.state || 'Haryana').trim(),
        pincode: (addr.pincode || '123024').trim(),
        address_type: (addr.address_type || addr.type || 'home').trim().toLowerCase(),
        is_default: Boolean(addr.is_default || addr.isDefault)
      };

      try {
        if (addr.id && typeof addr.id === 'number' && addr.id < 1000000000) {
          const res = await this.fetchWithAuth(`/addresses/${addr.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          if (res && res.success) return res;
        } else {
          const res = await this.fetchWithAuth('/addresses', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          if (res && res.success) return res;
        }
      } catch (e) {
        console.warn('saveAddress backend fallback:', e);
      }

      return {
        success: true,
        data: { id: addr.id || Date.now(), ...payload }
      };
    },

    // ==========================================
    // RAZORPAY PAYMENT METHODS
    // ==========================================

    async createPaymentOrder(orderId) {
      return await this.fetchWithAuth('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ order_id: Number(orderId) })
      });
    },

    async verifyPayment(payload) {
      return await this.fetchWithAuth('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async retryPayment(orderId) {
      return await this.fetchWithAuth('/payments/retry', {
        method: 'POST',
        body: JSON.stringify({ order_id: Number(orderId) })
      });
    },

    async getPaymentHistory() {
      try {
        const res = await this.fetchWithAuth('/payments/history');
        if (res && res.success) return res;
      } catch (e) {}
      return { success: true, data: [] };
    },

    async adminGetPayments(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await this.fetchWithAuth(`/admin/payments${qs ? '?' + qs : ''}`);
    },

    async adminGetPaymentDetail(paymentId) {
      return await this.fetchWithAuth(`/admin/payments/${paymentId}`);
    },

    async adminRefundPayment(paymentId, payload = {}) {
      return await this.fetchWithAuth(`/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  };
})();

// Export globally for client modules
window.LocalMartAPI = LocalMartAPI;
window.BigBasketAPI = LocalMartAPI;


