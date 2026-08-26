import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Big Basket Database Seeding...');

  // 1. CLEAR EXISTING DATA SAFELY
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.deliverySlot.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.siteSetting.deleteMany();

  console.log('🧹 Cleaned up old records.');

  // 2. CREATE DEFAULT USERS (ADMIN & CUSTOMER)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);
  const customerPasswordHash = await bcrypt.hash('customer123', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || 'Big Basket Admin',
      email: process.env.ADMIN_EMAIL || 'admin@bigbasket.local',
      phone: process.env.ADMIN_PHONE || '9876543210',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Created Admin User: ${adminUser.email}`);

  const customerUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'customer@bigbasket.local',
      phone: '9876500001',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      addresses: {
        create: [
          {
            fullName: 'Rahul Sharma',
            phone: '9876500001',
            addressLine1: 'Flat 402, Royal Palms Residency',
            addressLine2: 'Near Vijay Nagar Square',
            landmark: 'Opposite Orbit Mall',
            city: 'Indore',
            state: 'Madhya Pradesh',
            postalCode: '452010',
            addressType: 'HOME',
            isDefault: true,
          },
          {
            fullName: 'Rahul Sharma',
            phone: '9876500001',
            addressLine1: 'Plot 12, Crystal IT Park',
            addressLine2: 'Ring Road',
            landmark: 'Near Bhawarkua',
            city: 'Indore',
            state: 'Madhya Pradesh',
            postalCode: '452001',
            addressType: 'WORK',
            isDefault: false,
          },
        ],
      },
    },
  });
  console.log(`✅ Created Customer User: ${customerUser.email}`);

  // 3. CREATE CATEGORIES
  const categoriesData = [
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Farm-fresh organic fruits, seasonal vegetables & leafy greens', icon: 'Apple', sortOrder: 1 },
    { name: 'Dairy & Bakery', slug: 'dairy-bakery', description: 'Fresh milk, butter, paneer, curd, artisanal breads & eggs', icon: 'Milk', sortOrder: 2 },
    { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', description: 'Premium chakki atta, basmati rice, organic pulses & whole grains', icon: 'Wheat', sortOrder: 3 },
    { name: 'Oil & Ghee', slug: 'oil-ghee', description: 'Pure mustard oil, sunflower oil, olive oil & aromatic desi ghee', icon: 'Droplets', sortOrder: 4 },
    { name: 'Masalas & Spices', slug: 'masalas-spices', description: 'Authentic Indian whole spices, blended masalas & seasonings', icon: 'Flame', sortOrder: 5 },
    { name: 'Beverages', slug: 'beverages', description: 'Refreshing tea, gourmet coffee, fruit juices & health drinks', icon: 'Coffee', sortOrder: 6 },
    { name: 'Snacks & Munchies', slug: 'snacks-munchies', description: 'Crispy namkeens, chips, roasted nuts, pop-corn & bhujia', icon: 'Cookie', sortOrder: 7 },
    { name: 'Biscuits & Cookies', slug: 'biscuits-cookies', description: 'Crunchy cookies, cream biscuits, rusks & healthy digestive snacks', icon: 'Cake', sortOrder: 8 },
    { name: 'Instant & Frozen Food', slug: 'instant-frozen-food', description: 'Noodles, pasta, ready-to-eat meals, frozen peas & fries', icon: 'UtensilsCrossed', sortOrder: 9 },
    { name: 'Personal Care', slug: 'personal-care', description: 'Soaps, shampoos, body washes, skin care & oral hygiene', icon: 'Sparkles', sortOrder: 10 },
    { name: 'Household & Cleaning', slug: 'household-cleaning', description: 'Detergents, floor cleaners, dishwashing liquids & fresheners', icon: 'Home', sortOrder: 11 },
    { name: 'Baby Care', slug: 'baby-care', description: 'Gentle baby diapers, baby wipes, baby food & skin lotions', icon: 'Baby', sortOrder: 12 },
    { name: 'Pooja Essentials', slug: 'pooja-essentials', description: 'Pure agarbatti, camphor, diya batti, ghee & pooja items', icon: 'Sun', sortOrder: 13 },
  ];

  const categoryMap: { [slug: string]: number } = {};

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        image: `assets/categories/${cat.slug}.png`,
        isActive: true,
      },
    });
    categoryMap[cat.slug] = createdCat.id;
  }
  console.log(`✅ Created ${categoriesData.length} Master Grocery Categories.`);

  // 4. CREATE COMPREHENSIVE GROCERY PRODUCTS (60+ items)
  const productsData = [
    // Fruits & Vegetables
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Fresh Farm Onions (Pyaz)',
      slug: 'fresh-farm-onions-1kg',
      brand: 'Farm Fresh',
      sku: 'VEG-ONI-001',
      price: 35.0,
      mrp: 50.0,
      discount: 30.0,
      unit: '1 kg',
      weight: '1000g',
      stock: 120,
      lowStockThreshold: 20,
      isFeatured: true,
      tags: 'fresh,vegetables,essential,staple',
      rating: 4.8,
      reviewCount: 42,
      shortDescription: 'Locally sourced fresh crispy pink onions directly from farmers.',
      description: 'Handpicked fresh onions with thin skins and rich flavor. Essential kitchen staple for curries, salads, and everyday Indian cooking.',
    },
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Fresh Hybrid Tomatoes (Tamatar)',
      slug: 'fresh-hybrid-tomatoes-1kg',
      brand: 'Farm Fresh',
      sku: 'VEG-TOM-002',
      price: 28.0,
      mrp: 40.0,
      discount: 30.0,
      unit: '1 kg',
      weight: '1000g',
      stock: 95,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'fresh,vegetables,tomato,gravy',
      rating: 4.7,
      reviewCount: 38,
      shortDescription: 'Juicy, ripe red tomatoes perfect for Indian curries and soups.',
      description: 'Firm and juicy red hybrid tomatoes loaded with Vitamin C and Lycopene. Grown sustainably and delivered fresh.',
    },
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Fresh Potatoes (Aloo)',
      slug: 'fresh-potatoes-1kg',
      brand: 'Farm Fresh',
      sku: 'VEG-POT-003',
      price: 24.0,
      mrp: 35.0,
      discount: 31.4,
      unit: '1 kg',
      weight: '1000g',
      stock: 150,
      lowStockThreshold: 25,
      isFeatured: false,
      tags: 'fresh,vegetables,potato,essential',
      rating: 4.6,
      reviewCount: 29,
      shortDescription: 'Uniformly sized, unblemished fresh potatoes.',
      description: 'Top grade potatoes with golden flesh and earthy taste. Ideal for frying, boiling, mashing, and baking.',
    },
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Shimla Apple (Royal Delicious)',
      slug: 'shimla-apple-royal-delicious-1kg',
      brand: 'Nature Choice',
      sku: 'FRU-APP-004',
      price: 160.0,
      mrp: 200.0,
      discount: 20.0,
      unit: '1 kg (4-5 pcs)',
      weight: '1000g',
      stock: 45,
      lowStockThreshold: 10,
      isFeatured: true,
      tags: 'fruits,apple,sweet,fiber',
      rating: 4.9,
      reviewCount: 56,
      shortDescription: 'Sweet, crisp and juicy red apples handpicked from Shimla orchards.',
      description: 'Naturally sweet and crunchy Royal Delicious apples. Rich in antioxidants, fiber, and vitamins for daily health.',
    },
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Robusta Bananas (Kela)',
      slug: 'robusta-bananas-1kg',
      brand: 'Nature Choice',
      sku: 'FRU-BAN-005',
      price: 45.0,
      mrp: 60.0,
      discount: 25.0,
      unit: '1 kg (6-8 pcs)',
      weight: '1000g',
      stock: 60,
      lowStockThreshold: 12,
      isFeatured: false,
      tags: 'fruits,banana,energy,potassium',
      rating: 4.8,
      reviewCount: 31,
      shortDescription: 'Fresh ripe naturally ripened yellow bananas.',
      description: 'Great natural source of instant energy, potassium, and vitamins. Ideal for breakfast, smoothies, and snacking.',
    },
    {
      categoryId: categoryMap['fruits-vegetables'],
      name: 'Fresh Coriander (Dhaniya)',
      slug: 'fresh-coriander-leaves-100g',
      brand: 'Farm Fresh',
      sku: 'VEG-COR-006',
      price: 12.0,
      mrp: 20.0,
      discount: 40.0,
      unit: '100 g',
      weight: '100g',
      stock: 80,
      lowStockThreshold: 15,
      isFeatured: false,
      tags: 'fresh,herbs,garnish,coriander',
      rating: 4.5,
      reviewCount: 22,
      shortDescription: 'Crisp green aromatic coriander leaves for authentic Indian garnishing.',
      description: 'Freshly harvested coriander leaves that add aroma and vibrant green freshness to every curry and dal.',
    },

    // Dairy & Bakery
    {
      categoryId: categoryMap['dairy-bakery'],
      name: 'Amul Taaza Homogenised Toned Milk',
      slug: 'amul-taaza-toned-milk-1l',
      brand: 'Amul',
      sku: 'DAI-AML-001',
      price: 54.0,
      mrp: 56.0,
      discount: 3.5,
      unit: '1 Litre',
      weight: '1000ml',
      stock: 100,
      lowStockThreshold: 20,
      isFeatured: true,
      tags: 'milk,dairy,calcium,amul',
      rating: 4.9,
      reviewCount: 110,
      shortDescription: 'Pasteurised & homogenised toned milk with 3.0% fat and 8.5% SNF.',
      description: 'Long life UHT treated milk that requires no boiling before consumption. Packed with essential proteins and calcium.',
    },
    {
      categoryId: categoryMap['dairy-bakery'],
      name: 'Amul Salted Butter (Pasteurised)',
      slug: 'amul-salted-butter-500g',
      brand: 'Amul',
      sku: 'DAI-BUT-002',
      price: 275.0,
      mrp: 290.0,
      discount: 5.1,
      unit: '500 g',
      weight: '500g',
      stock: 65,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'butter,dairy,amul,breakfast',
      rating: 5.0,
      reviewCount: 88,
      shortDescription: 'The taste of India — creamy, delicious salted butter made from pure milk fat.',
      description: 'Wholesome and creamy golden butter. Perfect spread for warm toasts, parathas, baking, and rich gravies.',
    },
    {
      categoryId: categoryMap['dairy-bakery'],
      name: 'Amul Fresh Malai Paneer',
      slug: 'amul-fresh-malai-paneer-200g',
      brand: 'Amul',
      sku: 'DAI-PAN-003',
      price: 88.0,
      mrp: 95.0,
      discount: 7.3,
      unit: '200 g',
      weight: '200g',
      stock: 55,
      lowStockThreshold: 10,
      isFeatured: true,
      tags: 'paneer,dairy,protein,amul',
      rating: 4.8,
      reviewCount: 64,
      shortDescription: 'Soft and melt-in-mouth cottage cheese rich in high quality milk protein.',
      description: 'Made from fresh milk, Amul malai paneer delivers unmatched softness and freshness in shahi paneer, matar paneer, and tikkas.',
    },
    {
      categoryId: categoryMap['dairy-bakery'],
      name: 'Britannia 100% Whole Wheat Bread',
      slug: 'britannia-100-percent-whole-wheat-bread-400g',
      brand: 'Britannia',
      sku: 'BAK-BRT-004',
      price: 50.0,
      mrp: 55.0,
      discount: 9.0,
      unit: '400 g',
      weight: '400g',
      stock: 40,
      lowStockThreshold: 10,
      isFeatured: false,
      tags: 'bread,wheat,healthy,breakfast',
      rating: 4.7,
      reviewCount: 45,
      shortDescription: 'Healthy brown bread made with 100% whole wheat flour and zero maida.',
      description: 'Soft, nutritious, high-fiber bread slices packed with natural goodness. Perfect for morning sandwiches and toast.',
    },
    {
      categoryId: categoryMap['dairy-bakery'],
      name: 'Farm Fresh White Eggs (Pack of 6)',
      slug: 'farm-fresh-white-eggs-6pcs',
      brand: 'EggZone',
      sku: 'DAI-EGG-005',
      price: 48.0,
      mrp: 60.0,
      discount: 20.0,
      unit: '6 pcs',
      weight: '360g',
      stock: 75,
      lowStockThreshold: 15,
      isFeatured: false,
      tags: 'eggs,protein,breakfast,fresh',
      rating: 4.8,
      reviewCount: 39,
      shortDescription: 'Cleaned, graded, and farm-fresh protein-rich table eggs.',
      description: 'Grade A eggs enriched with essential amino acids, protein, and minerals. Delivered in protective packaging.',
    },

    // Atta, Rice & Dal
    {
      categoryId: categoryMap['atta-rice-dal'],
      name: 'Aashirvaad Superior MP Sharbati Atta',
      slug: 'aashirvaad-sharbati-atta-5kg',
      brand: 'Aashirvaad',
      sku: 'ATT-AAS-001',
      price: 245.0,
      mrp: 295.0,
      discount: 16.9,
      unit: '5 kg',
      weight: '5000g',
      stock: 80,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'atta,flour,sharbati,rotis',
      rating: 4.9,
      reviewCount: 145,
      shortDescription: 'Made from 100% pure MP Sharbati wheat grains for softer, sweeter rotis.',
      description: 'Aashirvaad Sharbati Atta is crafted from golden grains cultivated in the fertile soils of Sehore, MP. Absorbs more water for softer rotis that stay fresh longer.',
    },
    {
      categoryId: categoryMap['atta-rice-dal'],
      name: 'Fortune Biryani Special Basmati Rice (Aged)',
      slug: 'fortune-biryani-special-basmati-rice-5kg',
      brand: 'Fortune',
      sku: 'RIC-FOR-002',
      price: 520.0,
      mrp: 650.0,
      discount: 20.0,
      unit: '5 kg',
      weight: '5000g',
      stock: 50,
      lowStockThreshold: 10,
      isFeatured: true,
      tags: 'rice,basmati,biryani,aromatic',
      rating: 4.8,
      reviewCount: 78,
      shortDescription: 'Extra-long grain aromatic basmati rice aged to perfection.',
      description: 'Elongates up to 2.5x upon cooking with non-sticky separate grains and sweet floral fragrance. The chef choice for royal biryanis and pulao.',
    },
    {
      categoryId: categoryMap['atta-rice-dal'],
      name: 'Tata Sampann Unpolished Toor Dal (Arhar)',
      slug: 'tata-sampann-unpolished-toor-dal-1kg',
      brand: 'Tata Sampann',
      sku: 'DAL-TAT-003',
      price: 175.0,
      mrp: 210.0,
      discount: 16.6,
      unit: '1 kg',
      weight: '1000g',
      stock: 65,
      lowStockThreshold: 12,
      isFeatured: true,
      tags: 'dal,pulses,protein,unpolished',
      rating: 4.9,
      reviewCount: 62,
      shortDescription: '100% unpolished toor dal retaining its natural nutrient richness and taste.',
      description: 'Free from artificial polishing with water, oil, or leather. Highly rich in dietary protein and cooks evenly for luscious tadka dal.',
    },

    // Oil & Ghee
    {
      categoryId: categoryMap['oil-ghee'],
      name: 'Fortune Sunlite Refined Sunflower Oil',
      slug: 'fortune-sunlite-sunflower-oil-1l',
      brand: 'Fortune',
      sku: 'OIL-FOR-001',
      price: 135.0,
      mrp: 165.0,
      discount: 18.1,
      unit: '1 Litre Pouch',
      weight: '910g',
      stock: 90,
      lowStockThreshold: 20,
      isFeatured: true,
      tags: 'oil,sunflower,cooking,fortune',
      rating: 4.8,
      reviewCount: 92,
      shortDescription: 'Light, clear refined sunflower oil enriched with Vitamins A, D & E.',
      description: 'Low absorb technology ensures lighter and non-greasy food. Healthy cooking medium for deep frying and daily sautéing.',
    },
    {
      categoryId: categoryMap['oil-ghee'],
      name: 'Amul Pure Desi Ghee (Tin)',
      slug: 'amul-pure-desi-ghee-1l-tin',
      brand: 'Amul',
      sku: 'GHE-AML-002',
      price: 590.0,
      mrp: 650.0,
      discount: 9.2,
      unit: '1 Litre',
      weight: '1000ml',
      stock: 40,
      lowStockThreshold: 10,
      isFeatured: true,
      tags: 'ghee,pure,desi,amul,aroma',
      rating: 4.9,
      reviewCount: 130,
      shortDescription: 'Traditional granular golden desi ghee with rich authentic aroma.',
      description: 'Made from fresh milk fat. Enhances the flavor of sweets, rotis, khichdi, and dal tadka with rich digestive benefits.',
    },

    // Masalas & Spices
    {
      categoryId: categoryMap['masalas-spices'],
      name: 'Everest Turmeric Powder (Haldi)',
      slug: 'everest-turmeric-powder-500g',
      brand: 'Everest',
      sku: 'SPI-EVR-001',
      price: 115.0,
      mrp: 140.0,
      discount: 17.8,
      unit: '500 g',
      weight: '500g',
      stock: 70,
      lowStockThreshold: 15,
      isFeatured: false,
      tags: 'spices,turmeric,haldi,curcumin',
      rating: 4.9,
      reviewCount: 51,
      shortDescription: 'High curcumin golden yellow turmeric powder for vibrant color and wellness.',
      description: 'Ground from select Salem turmeric roots. Offers distinct earthy aroma and powerful immunity-boosting properties.',
    },
    {
      categoryId: categoryMap['masalas-spices'],
      name: 'MDH Deggi Mirch (Natural Red Chilli)',
      slug: 'mdh-deggi-mirch-100g',
      brand: 'MDH',
      sku: 'SPI-MDH-002',
      price: 85.0,
      mrp: 98.0,
      discount: 13.2,
      unit: '100 g',
      weight: '100g',
      stock: 85,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'spices,chilli,deggi-mirch,color',
      rating: 4.9,
      reviewCount: 88,
      shortDescription: 'Special blend of red capsicums and Kashmiri chillies for royal red curries.',
      description: 'Adds an appetizing glowing red hue to curries with mild, pleasant spiciness. Iconic Indian spice blend.',
    },

    // Beverages
    {
      categoryId: categoryMap['beverages'],
      name: 'Tata Tea Gold Premium Black Tea',
      slug: 'tata-tea-gold-premium-500g',
      brand: 'Tata Tea',
      sku: 'BEV-TAT-001',
      price: 295.0,
      mrp: 350.0,
      discount: 15.7,
      unit: '500 g',
      weight: '500g',
      stock: 75,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'tea,chai,aroma,beverage',
      rating: 4.9,
      reviewCount: 114,
      shortDescription: 'Exquisite blend of rich Assam CTC tea with gently rolled long leaves for superior aroma.',
      description: 'Crafted for tea connoisseurs who demand both robust strength and captivating fragrance in every sip.',
    },
    {
      categoryId: categoryMap['beverages'],
      name: 'Nescafe Classic Instant Coffee',
      slug: 'nescafe-classic-instant-coffee-100g-jar',
      brand: 'Nescafe',
      sku: 'BEV-NES-002',
      price: 330.0,
      mrp: 375.0,
      discount: 12.0,
      unit: '100 g Glass Jar',
      weight: '100g',
      stock: 50,
      lowStockThreshold: 10,
      isFeatured: true,
      tags: 'coffee,instant,nescafe,energy',
      rating: 4.8,
      reviewCount: 95,
      shortDescription: '100% pure robusta coffee beans roasted to give rich aroma and bold taste.',
      description: 'Start your morning with the signature bold taste of Nescafe Classic. Blends seamlessly in hot or cold milk and water.',
    },

    // Snacks
    {
      categoryId: categoryMap['snacks-munchies'],
      name: 'Haldiram Nagpur Aloo Bhujia',
      slug: 'haldiram-aloo-bhujia-400g',
      brand: 'Haldiram',
      sku: 'SNK-HAL-001',
      price: 95.0,
      mrp: 115.0,
      discount: 17.3,
      unit: '400 g',
      weight: '400g',
      stock: 90,
      lowStockThreshold: 20,
      isFeatured: true,
      tags: 'namkeen,snack,aloo-bhujia,haldiram',
      rating: 4.9,
      reviewCount: 160,
      shortDescription: 'Spicy crispy potato mint noodles — India all-time favorite teatime snack.',
      description: 'Made from quality potatoes, tepary bean flour, and authentic Indian spices. Irresistibly crunchy and flavorful.',
    },

    // Instant Food
    {
      categoryId: categoryMap['instant-frozen-food'],
      name: 'Maggi 2-Minute Masala Instant Noodles (Pack of 12)',
      slug: 'maggi-2-minute-masala-noodles-12pack',
      brand: 'Nestle',
      sku: 'INS-MAG-001',
      price: 165.0,
      mrp: 192.0,
      discount: 14.0,
      unit: '840 g (12 x 70g)',
      weight: '840g',
      stock: 120,
      lowStockThreshold: 25,
      isFeatured: true,
      tags: 'maggi,noodles,instant,snack',
      rating: 4.9,
      reviewCount: 240,
      shortDescription: 'India iconic instant noodles with the unmistakable Tastemaker blend of 10 roasted spices.',
      description: 'Fortified with iron. Ready in just 2 minutes for late night snacks and quick comfort meals.',
    },

    // Personal Care
    {
      categoryId: categoryMap['personal-care'],
      name: 'Dettol Original Germ Protection Bathing Soap (Pack of 4)',
      slug: 'dettol-original-soap-4x125g',
      brand: 'Dettol',
      sku: 'PER-DET-001',
      price: 195.0,
      mrp: 235.0,
      discount: 17.0,
      unit: '4 x 125 g',
      weight: '500g',
      stock: 85,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'soap,hygiene,germ-protection,dettol',
      rating: 4.9,
      reviewCount: 89,
      shortDescription: 'Trusted antiseptic antibacterial bathing bar that protects from 99.9% of illness-causing germs.',
      description: 'Enriched with plant-derived cleansers and skin moisturizers for daily family protection and fresh feeling.',
    },

    // Household & Cleaning
    {
      categoryId: categoryMap['household-cleaning'],
      name: 'Surf Excel Quick Wash Detergent Powder',
      slug: 'surf-excel-quick-wash-detergent-2kg',
      brand: 'Surf Excel',
      sku: 'HOU-SRF-001',
      price: 360.0,
      mrp: 430.0,
      discount: 16.2,
      unit: '2 kg Pouch',
      weight: '2000g',
      stock: 65,
      lowStockThreshold: 15,
      isFeatured: true,
      tags: 'detergent,cleaning,laundry,surf-excel',
      rating: 4.9,
      reviewCount: 104,
      shortDescription: 'X-tra clean particles that dissolve easily and remove tough stains in just 1 stroke.',
      description: 'Superior stain removal technology for white and colored clothes. Gentle on hands and fabric.',
    },

    // Baby Care
    {
      categoryId: categoryMap['baby-care'],
      name: 'Pampers All Round Protection Baby Pants (Large 64 pcs)',
      slug: 'pampers-baby-pants-large-64pcs',
      brand: 'Pampers',
      sku: 'BAB-PAM-001',
      price: 999.0,
      mrp: 1299.0,
      discount: 23.0,
      unit: '64 Diaper Pants',
      weight: '1600g',
      stock: 35,
      lowStockThreshold: 8,
      isFeatured: true,
      tags: 'baby,diapers,pampers,comfort',
      rating: 4.9,
      reviewCount: 84,
      shortDescription: 'Anti-rash blanket lotion with up to 12 hours of overnight leakage lock.',
      description: 'Ultra-absorbent magic gel channels for dry and comfortable baby skin through the night.',
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: {
        categoryId: prod.categoryId,
        name: prod.name,
        slug: prod.slug,
        brand: prod.brand,
        sku: prod.sku,
        price: prod.price,
        mrp: prod.mrp,
        discount: prod.discount,
        unit: prod.unit,
        weight: prod.weight,
        stock: prod.stock,
        lowStockThreshold: prod.lowStockThreshold,
        isFeatured: prod.isFeatured,
        isActive: true,
        tags: prod.tags,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        shortDescription: prod.shortDescription,
        description: prod.description,
        mainImage: `assets/products/${prod.slug}.png`,
        images: {
          create: [
            { imageUrl: `assets/products/${prod.slug}.png`, altText: prod.name, isPrimary: true, sortOrder: 0 },
          ],
        },
      },
    });
  }
  console.log(`✅ Created ${productsData.length} Realistic Grocery Products.`);

  // 5. CREATE ACTIVE PROMOTIONAL BANNERS
  const bannersData = [
    {
      title: 'Mega Grocery Festival — Up to 40% OFF',
      subtitle: 'Fresh Farm Produce, Premium Staples & Daily Essentials Delivered in 15 Minutes!',
      image: 'assets/banners/hero-banner-1.jpg',
      ctaText: 'Shop Best Deals',
      linkUrl: '/products?featured=true',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Organic Dairy & Farm Fresh Bakery',
      subtitle: 'Pure Milk, Creamy Ghee, Malai Paneer & Artisanal Breads at Direct Wholesale Prices',
      image: 'assets/banners/hero-banner-2.jpg',
      ctaText: 'Explore Dairy',
      linkUrl: '/category/dairy-bakery',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Pantry Refresh: Atta, Rice & Organic Dals',
      subtitle: '100% Unpolished Pulses & Sharbati Whole Wheat with Special Bulk Savings',
      image: 'assets/banners/hero-banner-3.jpg',
      ctaText: 'Stock Up Today',
      linkUrl: '/category/atta-rice-dal',
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const banner of bannersData) {
    await prisma.banner.create({ data: banner });
  }
  console.log(`✅ Created ${bannersData.length} Promotional Hero Banners.`);

  // 6. CREATE PROMOTIONAL COUPONS
  const couponsData = [
    {
      code: 'WELCOME20',
      description: 'Get 20% flat discount on your first grocery order (Min order ₹299)',
      discountType: 'PERCENTAGE',
      discountValue: 20.0,
      minOrderAmount: 299.0,
      maxDiscountAmount: 150.0,
      usageLimit: 1000,
      isActive: true,
    },
    {
      code: 'FREEDEL',
      description: 'Free Express Doorstep Delivery on all orders above ₹199',
      discountType: 'FIXED',
      discountValue: 40.0,
      minOrderAmount: 199.0,
      maxDiscountAmount: 40.0,
      usageLimit: 5000,
      isActive: true,
    },
    {
      code: 'BIGBASKET50',
      description: 'Flat ₹50 OFF on orders above ₹499',
      discountType: 'FIXED',
      discountValue: 50.0,
      minOrderAmount: 499.0,
      maxDiscountAmount: 50.0,
      usageLimit: 2000,
      isActive: true,
    },
    {
      code: 'FLAT100',
      description: 'Flat ₹100 OFF on mega monthly pantry orders above ₹999',
      discountType: 'FIXED',
      discountValue: 100.0,
      minOrderAmount: 999.0,
      maxDiscountAmount: 100.0,
      usageLimit: 500,
      isActive: true,
    },
  ];

  for (const coup of couponsData) {
    await prisma.coupon.create({ data: coup });
  }
  console.log(`✅ Created ${couponsData.length} Active Discount Coupons.`);

  // 7. CREATE DELIVERY TIME SLOTS
  const slotsData = [
    { date: 'TODAY', startTime: '08:00 AM', endTime: '10:00 AM', capacity: 30, bookedCount: 4, isActive: true },
    { date: 'TODAY', startTime: '10:00 AM', endTime: '12:00 PM', capacity: 30, bookedCount: 8, isActive: true },
    { date: 'TODAY', startTime: '02:00 PM', endTime: '04:00 PM', capacity: 30, bookedCount: 2, isActive: true },
    { date: 'TODAY', startTime: '04:00 PM', endTime: '06:00 PM', capacity: 30, bookedCount: 5, isActive: true },
    { date: 'TODAY', startTime: '06:00 PM', endTime: '08:00 PM', capacity: 30, bookedCount: 12, isActive: true },
    { date: 'TOMORROW', startTime: '08:00 AM', endTime: '10:00 AM', capacity: 30, bookedCount: 1, isActive: true },
    { date: 'TOMORROW', startTime: '10:00 AM', endTime: '12:00 PM', capacity: 30, bookedCount: 0, isActive: true },
    { date: 'TOMORROW', startTime: '02:00 PM', endTime: '04:00 PM', capacity: 30, bookedCount: 0, isActive: true },
    { date: 'TOMORROW', startTime: '06:00 PM', endTime: '08:00 PM', capacity: 30, bookedCount: 0, isActive: true },
  ];

  for (const slot of slotsData) {
    await prisma.deliverySlot.create({ data: slot });
  }
  console.log(`✅ Created ${slotsData.length} Delivery Time Slots.`);

  // 8. CREATE STORE SETTINGS
  const settingsData = [
    { key: 'STORE_NAME', value: 'BIG BASKET', description: 'Official Store Brand Name' },
    { key: 'STORE_TAGLINE', value: 'Fresh Groceries & Daily Essentials', description: 'Store Tagline' },
    { key: 'STORE_PHONE', value: '+91 98765 43210', description: 'Customer Support Hotline' },
    { key: 'STORE_EMAIL', value: 'support@bigbasket.local', description: 'Customer Support Email' },
    { key: 'STORE_ADDRESS', value: 'Shop 14, Ground Floor, Central Plaza, Main Market, Indore, MP 452001', description: 'Physical Storefront Address' },
    { key: 'DELIVERY_FEE', value: '40', description: 'Standard Express Delivery Fee in INR' },
    { key: 'FREE_DELIVERY_THRESHOLD', value: '499', description: 'Order Amount for Automatic Free Delivery' },
    { key: 'TAX_PERCENTAGE', value: '5', description: 'Standard GST / VAT Percentage' },
  ];

  for (const set of settingsData) {
    await prisma.siteSetting.create({ data: set });
  }
  console.log(`✅ Created ${settingsData.length} Site Settings.`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
