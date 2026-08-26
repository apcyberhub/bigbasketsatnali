import json
import logging
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models import (
    User, Category, Product, ProductImage, Address, Cart,
    DeliveryZone, Coupon, StoreSetting
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bigbasket.seeder")

CATEGORIES_DATA = [
    {"name": "Fruits & Vegetables", "slug": "fruits-vegetables", "icon": "🥦", "discount_label": "Up to 35% OFF", "sort_order": 1},
    {"name": "Atta, Rice & Dal", "slug": "atta-rice-dal", "icon": "🌾", "discount_label": "Up to 25% OFF", "sort_order": 2},
    {"name": "Dairy & Breakfast", "slug": "dairy-breakfast", "icon": "🥛", "discount_label": "Up to 20% OFF", "sort_order": 3},
    {"name": "Bakery & Bread", "slug": "bakery", "icon": "🍞", "discount_label": "Fresh Daily", "sort_order": 4},
    {"name": "Biscuits & Cookies", "slug": "biscuits", "icon": "🍪", "discount_label": "Up to 30% OFF", "sort_order": 5},
    {"name": "Snacks & Namkeen", "slug": "snacks", "icon": "🥨", "discount_label": "Up to 30% OFF", "sort_order": 6},
    {"name": "Chocolates & Sweets", "slug": "chocolates", "icon": "🍫", "discount_label": "Up to 40% OFF", "sort_order": 7},
    {"name": "Beverages & Juices", "slug": "beverages", "icon": "🥤", "discount_label": "Up to 30% OFF", "sort_order": 8},
    {"name": "Instant Food & Noodles", "slug": "instant-food", "icon": "🍜", "discount_label": "Up to 25% OFF", "sort_order": 9},
    {"name": "Masala & Spices", "slug": "masala-spices", "icon": "🌶️", "discount_label": "Up to 35% OFF", "sort_order": 10},
    {"name": "Edible Oil & Ghee", "slug": "oil-ghee", "icon": "🛢️", "discount_label": "Up to 20% OFF", "sort_order": 11},
    {"name": "Personal Care & Hygiene", "slug": "personal-care", "icon": "🧴", "discount_label": "Up to 45% OFF", "sort_order": 12},
    {"name": "Beauty & Skincare", "slug": "beauty", "icon": "💄", "discount_label": "Up to 40% OFF", "sort_order": 13},
    {"name": "Household Essentials", "slug": "household", "icon": "🧼", "discount_label": "Up to 35% OFF", "sort_order": 14},
    {"name": "Cleaning & Floor Care", "slug": "cleaning", "icon": "🧹", "discount_label": "Up to 40% OFF", "sort_order": 15},
    {"name": "Baby Care & Diapers", "slug": "baby-care", "icon": "👶", "discount_label": "Up to 25% OFF", "sort_order": 16},
    {"name": "Toys, Kids & Games", "slug": "toys-games", "icon": "🧸", "discount_label": "Up to 50% OFF", "sort_order": 17},
    {"name": "Stationery & Office", "slug": "stationery", "icon": "✏️", "discount_label": "Up to 30% OFF", "sort_order": 18},
    {"name": "Home & Kitchen", "slug": "home-kitchen", "icon": "🏠", "discount_label": "Up to 30% OFF", "sort_order": 19},
    {"name": "Electronics & Gadgets", "slug": "electronics", "icon": "📱", "discount_label": "Up to 35% OFF", "sort_order": 20},
    {"name": "Pet Supplies & Food", "slug": "pet-care", "icon": "🐶", "discount_label": "Up to 20% OFF", "sort_order": 21}
]

PRODUCTS_SEED = [
    # DAIRY & BREAKFAST
    {
        "sku": "SKU-MILK-001",
        "name": "Amul Taaza Homogenised Toned Milk",
        "slug": "amul-taaza-homogenised-toned-milk-1l",
        "brand": "Amul",
        "category_slug": "dairy-breakfast",
        "subcategory_name": "Milk",
        "weight": "1 L",
        "price": Decimal("56.00"),
        "mrp": Decimal("62.00"),
        "discount_percentage": 10,
        "stock_quantity": 50,
        "unit": "carton",
        "emoji": "🥛",
        "badge": "Bestseller",
        "eta": "10 mins",
        "rating": Decimal("4.80"),
        "review_count": 1240,
        "tags": "milk, toned milk, amul taaza, dairy, breakfast, fresh milk",
        "description": "Amul Taaza is fresh pasteurized toned milk that is virtually free from bacteria. It delivers pure, creamy nutrition for your entire family.",
        "highlights": json.dumps(["Pasteurized & Homogenized", "Zero preservatives added", "Rich in natural Calcium & Vitamin D3"]),
        "specifications": json.dumps({"Brand": "Amul", "Shelf Life": "180 Days", "Packaging": "Tetra Pak", "Country of Origin": "India"}),
        "is_featured": True
    },
    {
        "sku": "SKU-BTR-002",
        "name": "Amul Salted Butter Block",
        "slug": "amul-salted-butter-block-500g",
        "brand": "Amul",
        "category_slug": "dairy-breakfast",
        "subcategory_name": "Butter",
        "weight": "500 g",
        "price": Decimal("275.00"),
        "mrp": Decimal("295.00"),
        "discount_percentage": 7,
        "stock_quantity": 40,
        "unit": "pack",
        "emoji": "🧈",
        "badge": "Popular",
        "eta": "10 mins",
        "rating": Decimal("4.90"),
        "review_count": 2150,
        "tags": "butter, amul butter, dairy, salted butter, breakfast, maska",
        "description": "The iconic Amul Butter made from pure cow and buffalo milk with delicious natural aroma and golden spreadability.",
        "highlights": json.dumps(["Utterly Butterly Delicious", "Made from pure fresh cream", "No artificial colors"]),
        "specifications": json.dumps({"Brand": "Amul", "Shelf Life": "12 Months", "Packaging": "Carton Pack"}),
        "is_featured": True
    },
    {
        "sku": "SKU-CHZ-004",
        "name": "Britannia Cheese Slices",
        "slug": "britannia-cheese-slices-200g",
        "brand": "Britannia",
        "category_slug": "dairy-breakfast",
        "subcategory_name": "Cheese",
        "weight": "200 g (10 Slices)",
        "price": Decimal("135.00"),
        "mrp": Decimal("155.00"),
        "discount_percentage": 13,
        "stock_quantity": 30,
        "unit": "pack",
        "emoji": "🧀",
        "badge": "13% OFF",
        "eta": "12 mins",
        "rating": Decimal("4.80"),
        "review_count": 920,
        "tags": "cheese, cheese slice, britannia, sandwich cheese, dairy",
        "description": "Rich, melt-in-the-mouth processed cheese slices packed with calcium and protein for sandwiches, burgers, and toast.",
        "highlights": json.dumps(["Individually wrapped slices", "High Calcium content", "Smooth melt texture"]),
        "specifications": json.dumps({"Brand": "Britannia", "Shelf Life": "9 Months", "Packaging": "Pouch Box"}),
        "is_featured": False
    },

    # BAKERY
    {
        "sku": "SKU-BRD-005",
        "name": "Modern 100% Whole Wheat Brown Bread",
        "slug": "modern-whole-wheat-brown-bread-400g",
        "brand": "Modern",
        "category_slug": "bakery",
        "subcategory_name": "Bread",
        "weight": "400 g",
        "price": Decimal("48.00"),
        "mrp": Decimal("55.00"),
        "discount_percentage": 13,
        "stock_quantity": 35,
        "unit": "loaf",
        "emoji": "🍞",
        "badge": "High Fiber",
        "eta": "10 mins",
        "rating": Decimal("4.60"),
        "review_count": 840,
        "tags": "bread, brown bread, whole wheat, bakery, modern bread",
        "description": "Baked fresh daily using 100% whole wheat flour. Loaded with natural dietary fiber, soft texture, and zero maida.",
        "highlights": json.dumps(["100% Whole Wheat Atta", "Zero Maida added", "Good source of natural fiber"]),
        "specifications": json.dumps({"Brand": "Modern", "Shelf Life": "5 Days", "Packaging": "Polybags"}),
        "is_featured": False
    },

    # ATTA, RICE & DAL
    {
        "sku": "SKU-ATTA-007",
        "name": "Aashirvaad Superior MP Sharbati Atta",
        "slug": "aashirvaad-superior-mp-sharbati-atta-5kg",
        "brand": "Aashirvaad",
        "category_slug": "atta-rice-dal",
        "subcategory_name": "Flour & Atta",
        "weight": "5 kg",
        "price": Decimal("245.00"),
        "mrp": Decimal("290.00"),
        "discount_percentage": 15,
        "stock_quantity": 60,
        "unit": "bag",
        "emoji": "🌾",
        "badge": "15% OFF",
        "eta": "15 mins",
        "rating": Decimal("4.80"),
        "review_count": 3100,
        "tags": "atta, flour, wheat flour, aashirvaad, sharbati atta, staples",
        "description": "Made from the heaviest grains of golden Sehore Sharbati wheat, ground using traditional chakki process for the softest rotis.",
        "highlights": json.dumps(["100% Pure MP Sharbati Wheat", "Traditional Chakki ground", "Zero Maida contamination"]),
        "specifications": json.dumps({"Brand": "Aashirvaad (ITC)", "Shelf Life": "3 Months", "Packaging": "Bag"}),
        "is_featured": True
    },
    {
        "sku": "SKU-RICE-008",
        "name": "India Gate Basmati Rice Super Rozana",
        "slug": "india-gate-basmati-rice-super-rozana-5kg",
        "brand": "India Gate",
        "category_slug": "atta-rice-dal",
        "subcategory_name": "Rice",
        "weight": "5 kg",
        "price": Decimal("420.00"),
        "mrp": Decimal("525.00"),
        "discount_percentage": 20,
        "stock_quantity": 45,
        "unit": "bag",
        "emoji": "🍚",
        "badge": "20% OFF",
        "eta": "15 mins",
        "rating": Decimal("4.70"),
        "review_count": 1890,
        "tags": "rice, basmati rice, india gate, rozana rice, staples",
        "description": "Aged long-grain basmati rice with distinct fragrant aroma and fluffy non-sticky grains.",
        "highlights": json.dumps(["Aged premium grains", "Non-sticky and aromatic", "Puff up to twice its length"]),
        "specifications": json.dumps({"Brand": "India Gate", "Shelf Life": "24 Months", "Packaging": "Polybag"}),
        "is_featured": False
    },
    {
        "sku": "SKU-DAL-009",
        "name": "Tata Sampann Unpolished Toor Dal",
        "slug": "tata-sampann-unpolished-toor-dal-1kg",
        "brand": "Tata Sampann",
        "category_slug": "atta-rice-dal",
        "subcategory_name": "Pulses & Dal",
        "weight": "1 kg",
        "price": Decimal("165.00"),
        "mrp": Decimal("195.00"),
        "discount_percentage": 15,
        "stock_quantity": 40,
        "unit": "pouch",
        "emoji": "🥣",
        "badge": "Unpolished",
        "eta": "12 mins",
        "rating": Decimal("4.80"),
        "review_count": 1420,
        "tags": "toor dal, arhar dal, tata sampann, pulses, dal, protein",
        "description": "Tata Sampann Toor Dal is unpolished, meaning it retains its natural goodness, rich aroma, and wholesome protein.",
        "highlights": json.dumps(["100% Unpolished Dal", "High Protein & Fiber", "Strict 5-step purity process"]),
        "specifications": json.dumps({"Brand": "Tata Sampann", "Shelf Life": "12 Months", "Packaging": "Pouch"}),
        "is_featured": False
    },

    # OIL & GHEE
    {
        "sku": "SKU-OIL-010",
        "name": "Fortune Sunlite Refined Sunflower Oil",
        "slug": "fortune-sunlite-refined-sunflower-oil-1l",
        "brand": "Fortune",
        "category_slug": "oil-ghee",
        "subcategory_name": "Cooking Oil",
        "weight": "1 L",
        "price": Decimal("138.00"),
        "mrp": Decimal("175.00"),
        "discount_percentage": 21,
        "stock_quantity": 50,
        "unit": "pouch",
        "emoji": "🌻",
        "badge": "21% OFF",
        "eta": "12 mins",
        "rating": Decimal("4.60"),
        "review_count": 950,
        "tags": "oil, cooking oil, sunflower oil, fortune oil, edible oil",
        "description": "Light, healthy refined sunflower oil enriched with Vitamins A and D, with high smoke point perfect for daily cooking.",
        "highlights": json.dumps(["Fortified with Vitamin A & D", "Light & easy to digest", "Zero cholesterol"]),
        "specifications": json.dumps({"Brand": "Fortune (Adani Wilmar)", "Shelf Life": "9 Months"}),
        "is_featured": False
    },
    {
        "sku": "SKU-GHEE-011",
        "name": "Amul Pure Desi Ghee Tin",
        "slug": "amul-pure-desi-ghee-tin-1l",
        "brand": "Amul",
        "category_slug": "oil-ghee",
        "subcategory_name": "Ghee",
        "weight": "1 L",
        "price": Decimal("595.00"),
        "mrp": Decimal("660.00"),
        "discount_percentage": 10,
        "stock_quantity": 30,
        "unit": "tin",
        "emoji": "🛢️",
        "badge": "Pure Desi Ghee",
        "eta": "15 mins",
        "rating": Decimal("4.90"),
        "review_count": 2800,
        "tags": "ghee, desi ghee, amul ghee, pure ghee, cow ghee",
        "description": "Traditional granular aromatic desi ghee prepared from fresh cream, ideal for sweets, tadka, and everyday rotis.",
        "highlights": json.dumps(["100% Pure Milk Fat", "Aromatic granular texture", "Rich source of Vitamin A"]),
        "specifications": json.dumps({"Brand": "Amul", "Shelf Life": "12 Months"}),
        "is_featured": True
    },

    # FRUITS & VEGETABLES
    {
        "sku": "SKU-VEG-012",
        "name": "Farm Fresh Hybrid Red Tomatoes",
        "slug": "farm-fresh-hybrid-red-tomatoes-1kg",
        "brand": "Farm Fresh",
        "category_slug": "fruits-vegetables",
        "subcategory_name": "Vegetables",
        "weight": "1 kg",
        "price": Decimal("34.00"),
        "mrp": Decimal("45.00"),
        "discount_percentage": 24,
        "stock_quantity": 80,
        "unit": "kg",
        "emoji": "🍅",
        "badge": "Farm Fresh",
        "eta": "10 mins",
        "rating": Decimal("4.80"),
        "review_count": 1650,
        "tags": "tomato, tomatoes, tamatar, fresh vegetables, farm fresh",
        "description": "Handpicked plump, ripe red hybrid tomatoes sourced daily from verified local mandis.",
        "highlights": json.dumps(["Hydro-cooled for freshness", "Zero chemical ripeners", "Rich in Lycopene antioxidant"]),
        "specifications": json.dumps({"Brand": "Big Basket Farm Fresh", "Shelf Life": "4-5 Days"}),
        "is_featured": True
    },
    {
        "sku": "SKU-VEG-013",
        "name": "Fresh Nashik Red Onions (Pyaz)",
        "slug": "fresh-nashik-red-onions-1kg",
        "brand": "Farm Fresh",
        "category_slug": "fruits-vegetables",
        "subcategory_name": "Vegetables",
        "weight": "1 kg",
        "price": Decimal("38.00"),
        "mrp": Decimal("48.00"),
        "discount_percentage": 21,
        "stock_quantity": 90,
        "unit": "kg",
        "emoji": "🧅",
        "badge": "Top Pick",
        "eta": "10 mins",
        "rating": Decimal("4.70"),
        "review_count": 1980,
        "tags": "onion, onions, pyaz, vegetables, staples, nashik onion",
        "description": "Firm and pungent high-grade Nashik red onions with multiple layers, perfect for gravies and salads.",
        "highlights": json.dumps(["Premium Grade-A Nashik crop", "Naturally cured & sorted", "Long shelf life"]),
        "specifications": json.dumps({"Brand": "Big Basket Farm Fresh", "Shelf Life": "14 Days"}),
        "is_featured": True
    },
    {
        "sku": "SKU-VEG-014",
        "name": "Fresh Farm Potatoes (Aloo)",
        "slug": "fresh-farm-potatoes-aloo-1kg",
        "brand": "Farm Fresh",
        "category_slug": "fruits-vegetables",
        "subcategory_name": "Vegetables",
        "weight": "1 kg",
        "price": Decimal("32.00"),
        "mrp": Decimal("40.00"),
        "discount_percentage": 20,
        "stock_quantity": 100,
        "unit": "kg",
        "emoji": "🥔",
        "badge": "Essential",
        "eta": "10 mins",
        "rating": Decimal("4.70"),
        "review_count": 1400,
        "tags": "potato, potatoes, aloo, vegetables, staples",
        "description": "Clean, skin-firm fresh potatoes ideal for boiling, curries, french fries, and daily dishes.",
        "highlights": json.dumps(["Low sugar content", "Easy to peel", "Firm & solid texture"]),
        "specifications": json.dumps({"Brand": "Big Basket Farm Fresh", "Shelf Life": "10 Days"}),
        "is_featured": False
    },
    {
        "sku": "SKU-FRT-015",
        "name": "Royal Delicious Kashmiri Red Apples",
        "slug": "royal-delicious-kashmiri-red-apples-1kg",
        "brand": "Fresh Orchard",
        "category_slug": "fruits-vegetables",
        "subcategory_name": "Fruits",
        "weight": "1 kg (4-5 pcs)",
        "price": Decimal("175.00"),
        "mrp": Decimal("220.00"),
        "discount_percentage": 20,
        "stock_quantity": 40,
        "unit": "box",
        "emoji": "🍎",
        "badge": "Sweet & Crisp",
        "eta": "12 mins",
        "rating": Decimal("4.90"),
        "review_count": 1120,
        "tags": "apple, apples, seb, kashmiri apple, fruits, fresh fruit",
        "description": "Crunchy, sweet, and aromatic handpicked Kashmiri apples from high altitude orchards.",
        "highlights": json.dumps(["Crisp juicy bite", "Naturally sweet aroma", "Rich in dietary fiber"]),
        "specifications": json.dumps({"Brand": "Fresh Orchard", "Shelf Life": "7-10 Days"}),
        "is_featured": True
    },

    # BEVERAGES
    {
        "sku": "SKU-TEA-017",
        "name": "Tata Tea Gold Premium Black Tea",
        "slug": "tata-tea-gold-premium-black-tea-500g",
        "brand": "Tata Tea",
        "category_slug": "beverages",
        "subcategory_name": "Tea",
        "weight": "500 g",
        "price": Decimal("285.00"),
        "mrp": Decimal("340.00"),
        "discount_percentage": 16,
        "stock_quantity": 45,
        "unit": "pack",
        "emoji": "☕",
        "badge": "16% OFF",
        "eta": "12 mins",
        "rating": Decimal("4.80"),
        "review_count": 2400,
        "tags": "tea, chai, tata tea, tata tea gold, beverages",
        "description": "A delicate blend of fine Assam CTC teas with 15% gently rolled long aromatic leaves.",
        "highlights": json.dumps(["Rich Assam CTC + Long Leaves", "Irresistible rich aroma", "Signature blend"]),
        "specifications": json.dumps({"Brand": "Tata Consumer Products", "Shelf Life": "12 Months"}),
        "is_featured": True
    },
    {
        "sku": "SKU-COF-018",
        "name": "Nescafe Classic Instant Coffee Powder",
        "slug": "nescafe-classic-instant-coffee-powder-100g",
        "brand": "Nescafe",
        "category_slug": "beverages",
        "subcategory_name": "Coffee",
        "weight": "100 g Glass Jar",
        "price": Decimal("198.00"),
        "mrp": Decimal("230.00"),
        "discount_percentage": 14,
        "stock_quantity": 35,
        "unit": "jar",
        "emoji": "☕",
        "badge": "Signature",
        "eta": "10 mins",
        "rating": Decimal("4.90"),
        "review_count": 1750,
        "tags": "coffee, nescafe, instant coffee, beverages",
        "description": "Crafted with 100% pure Robusta and Arabica coffee beans, roasted to perfection for that classic bold aroma.",
        "highlights": json.dumps(["100% Pure Coffee Beans", "Distinctive full-bodied roast", "Dissolves instantly"]),
        "specifications": json.dumps({"Brand": "Nestle", "Shelf Life": "24 Months"}),
        "is_featured": False
    },

    # BISCUITS & SNACKS
    {
        "sku": "SKU-BSC-020",
        "name": "Parle-G Gold Glucose Biscuits",
        "slug": "parle-g-gold-glucose-biscuits-1kg",
        "brand": "Parle",
        "category_slug": "biscuits",
        "subcategory_name": "Glucose Biscuits",
        "weight": "1 kg Value Pack",
        "price": Decimal("95.00"),
        "mrp": Decimal("110.00"),
        "discount_percentage": 14,
        "stock_quantity": 75,
        "unit": "pack",
        "emoji": "🍪",
        "badge": "All-Time Favorite",
        "eta": "10 mins",
        "rating": Decimal("4.90"),
        "review_count": 3800,
        "tags": "biscuit, parle g, glucose biscuit, cookies, chai biscuit",
        "description": "India’s favorite tea-time biscuit with golden crunch, wheat goodness, and unmistakable taste.",
        "highlights": json.dumps(["Enriched with Wheat & Milk", "Quick Energy Source", "Value family pack"]),
        "specifications": json.dumps({"Brand": "Parle Products", "Shelf Life": "6 Months"}),
        "is_featured": True
    },
    {
        "sku": "SKU-SNK-022",
        "name": "Haldiram's Nagpur Bhujia Sev",
        "slug": "haldirams-nagpur-bhujia-sev-400g",
        "brand": "Haldiram's",
        "category_slug": "snacks",
        "subcategory_name": "Namkeen",
        "weight": "400 g",
        "price": Decimal("105.00"),
        "mrp": Decimal("125.00"),
        "discount_percentage": 16,
        "stock_quantity": 50,
        "unit": "pouch",
        "emoji": "🥨",
        "badge": "Crispy Snack",
        "eta": "10 mins",
        "rating": Decimal("4.80"),
        "review_count": 1950,
        "tags": "namkeen, bhujia, haldiram, bhujia sev, snacks",
        "description": "Crispy, spicy moth bean and besan noodle snacks seasoned with authentic Rajasthani spices.",
        "highlights": json.dumps(["Crispy Moth Bean Sev", "Authentic Indian Spices", "Zero trans fat"]),
        "specifications": json.dumps({"Brand": "Haldiram Snacks", "Shelf Life": "6 Months"}),
        "is_featured": True
    },

    # CHOCOLATES
    {
        "sku": "SKU-CHK-024",
        "name": "Cadbury Dairy Milk Silk Chocolate Bar",
        "slug": "cadbury-dairy-milk-silk-chocolate-bar-150g",
        "brand": "Cadbury",
        "category_slug": "chocolates",
        "subcategory_name": "Chocolate Bars",
        "weight": "150 g",
        "price": Decimal("165.00"),
        "mrp": Decimal("185.00"),
        "discount_percentage": 11,
        "stock_quantity": 60,
        "unit": "bar",
        "emoji": "🍫",
        "badge": "Best Lover",
        "eta": "10 mins",
        "rating": Decimal("4.90"),
        "review_count": 4200,
        "tags": "chocolate, cadbury, dairy milk, silk, sweet, dessert",
        "description": "Silk is made with a glass and a half of milk, creating the silkiest chocolate bar that melts luxuriously in your mouth.",
        "highlights": json.dumps(["Smoother, Creamier, Silkier", "100% Sustainably sourced Cocoa", "Melt-in-mouth texture"]),
        "specifications": json.dumps({"Brand": "Mondelez Cadbury", "Shelf Life": "12 Months"}),
        "is_featured": True
    },

    # INSTANT FOOD
    {
        "sku": "SKU-NOD-027",
        "name": "Nestle Maggi 2-Minute Masala Noodles",
        "slug": "nestle-maggi-2-minute-masala-noodles-560g",
        "brand": "Maggi",
        "category_slug": "instant-food",
        "subcategory_name": "Noodles",
        "weight": "560 g (Pack of 8)",
        "price": Decimal("110.00"),
        "mrp": Decimal("128.00"),
        "discount_percentage": 14,
        "stock_quantity": 70,
        "unit": "pack",
        "emoji": "🍜",
        "badge": "Super Saver",
        "eta": "10 mins",
        "rating": Decimal("4.90"),
        "review_count": 5200,
        "tags": "maggi, instant noodles, masala noodles, nestle maggi",
        "description": "India's most loved 2-minute instant noodles prepared with signature blend of 10 spices and fortified with Iron.",
        "highlights": json.dumps(["Fortified with Iron", "Signature Tastemaker", "Ready in 2 minutes"]),
        "specifications": json.dumps({"Brand": "Nestle Maggi", "Shelf Life": "8 Months"}),
        "is_featured": True
    },

    # PERSONAL CARE & HOUSEHOLD
    {
        "sku": "SKU-SOP-031",
        "name": "Dettol Original Germ Protection Soap",
        "slug": "dettol-original-germ-protection-soap-5pk",
        "brand": "Dettol",
        "category_slug": "personal-care",
        "subcategory_name": "Bath & Soap",
        "weight": "Pack of 5 (125 g each)",
        "price": Decimal("245.00"),
        "mrp": Decimal("295.00"),
        "discount_percentage": 17,
        "stock_quantity": 55,
        "unit": "multipack",
        "emoji": "🧼",
        "badge": "100% Protection",
        "eta": "12 mins",
        "rating": Decimal("4.80"),
        "review_count": 3400,
        "tags": "soap, dettol, bath soap, germ protection, personal care",
        "description": "Trusted Dettol soap formulated with 99.9% germ protection and skin moisturizers.",
        "highlights": json.dumps(["99.9% Germ Protection", "Moisturizing glycerin", "IMA recommended"]),
        "specifications": json.dumps({"Brand": "Reckitt Benckiser", "Shelf Life": "24 Months"}),
        "is_featured": True
    },
    {
        "sku": "SKU-TOY-050",
        "name": "Hot Wheels 5-Car Gift Pack",
        "slug": "hot-wheels-5-car-gift-pack",
        "brand": "Hot Wheels",
        "category_slug": "toys-games",
        "subcategory_name": "Die-Cast Cars",
        "weight": "Pack of 5 Diecast Cars",
        "price": Decimal("749.00"),
        "mrp": Decimal("899.00"),
        "discount_percentage": 17,
        "stock_quantity": 25,
        "unit": "pack",
        "emoji": "🏎️",
        "badge": "Collector's Pack",
        "eta": "15 mins",
        "rating": Decimal("4.90"),
        "review_count": 890,
        "tags": "toys, hot wheels, diecast, cars, kids toys, gift pack",
        "description": "Speed into an instant Hot Wheels collection with a race-ready pack of five highly detailed die-cast vehicles.",
        "highlights": json.dumps(["1:64 Scale die-cast vehicles", "Authentic styling & eye-catching decos", "High quality metal build"]),
        "specifications": json.dumps({"Brand": "Mattel Hot Wheels", "Age": "3+ Years", "Material": "Diecast Metal"}),
        "is_featured": True
    }
]


def seed_database():
    """
    Initializes tables and populates development categories, products, and default test account.
    """
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Seed Categories
        category_map = {}
        for cat_data in CATEGORIES_DATA:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                category_map[cat_data["slug"]] = cat.id
                logger.info(f"Created category: {cat_data['name']}")
            else:
                category_map[cat_data["slug"]] = existing.id

        # 2. Seed Products
        for prod_data in PRODUCTS_SEED:
            cat_slug = prod_data.pop("category_slug")
            cat_id = category_map.get(cat_slug)
            if not cat_id:
                continue

            existing_prod = db.query(Product).filter(Product.sku == prod_data["sku"]).first()
            if not existing_prod:
                prod = Product(category_id=cat_id, **prod_data)
                db.add(prod)
                db.flush()
                # Add default product image
                img = ProductImage(
                    product_id=prod.id,
                    image_url=f"assets/products/{prod.slug}.png",
                    alt_text=prod.name,
                    sort_order=0
                )
                db.add(img)
                logger.info(f"Created product: {prod.name}")

        # 3. Seed Super Admin Account
        admin_email = "admin@bigbasket.local"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                full_name="Store Super Admin",
                email=admin_email,
                phone="9999988888",
                password_hash=hash_password("admin123"),
                is_active=True,
                is_verified=True,
                is_admin=True
            )
            db.add(admin_user)
            db.flush()
            db.add(Cart(user_id=admin_user.id))
            logger.info("Created Admin user: Store Super Admin (admin@bigbasket.local / admin123)")

        # 4. Seed Demo Customer User
        demo_email = "customer@example.com"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            demo_user = User(
                full_name="Abhishek Sharma",
                email=demo_email,
                phone="9876543210",
                password_hash=hash_password("password123"),
                is_active=True,
                is_verified=True,
                is_admin=False
            )
            db.add(demo_user)
            db.flush()

            # Add demo cart
            db.add(Cart(user_id=demo_user.id))

            # Add demo address
            db.add(Address(
                user_id=demo_user.id,
                full_name="Abhishek Sharma",
                phone="9876543210",
                address_line1="House #42, Near Old Bus Stand",
                address_line2="Main Market Road",
                landmark="Opposite State Bank",
                city="Satnali",
                state="Haryana",
                pincode="123024",
                address_type="home",
                is_default=True
            ))
        # 5. Seed Delivery Zones
        zone1 = db.query(DeliveryZone).filter(DeliveryZone.name == "Satnali Local Core").first()
        if not zone1:
            db.add(DeliveryZone(
                name="Satnali Local Core",
                pincodes="123024, 123025",
                city="Satnali",
                state="Haryana",
                delivery_fee=Decimal("30.00"),
                free_delivery_threshold=Decimal("499.00"),
                minimum_order=Decimal("99.00"),
                estimated_min_minutes=15,
                estimated_max_minutes=30,
                is_active=True
            ))

        zone2 = db.query(DeliveryZone).filter(DeliveryZone.name == "Mahendragarh Outskirts").first()
        if not zone2:
            db.add(DeliveryZone(
                name="Mahendragarh Outskirts",
                pincodes="123029, 123034, 123001",
                city="Mahendragarh",
                state="Haryana",
                delivery_fee=Decimal("50.00"),
                free_delivery_threshold=Decimal("799.00"),
                minimum_order=Decimal("199.00"),
                estimated_min_minutes=30,
                estimated_max_minutes=60,
                is_active=True
            ))

        # 6. Seed Coupons
        c1 = db.query(Coupon).filter(Coupon.code == "WELCOME20").first()
        if not c1:
            db.add(Coupon(
                code="WELCOME20",
                description="Flat 20% discount on orders above ₹299 (Max ₹100)",
                discount_type="percentage",
                discount_value=Decimal("20.00"),
                minimum_order=Decimal("299.00"),
                maximum_discount=Decimal("100.00"),
                usage_limit=1000,
                per_user_limit=3,
                is_active=True
            ))

        c2 = db.query(Coupon).filter(Coupon.code == "FREEDEL").first()
        if not c2:
            db.add(Coupon(
                code="FREEDEL",
                description="Flat ₹30 OFF delivery discount on orders above ₹199",
                discount_type="fixed",
                discount_value=Decimal("30.00"),
                minimum_order=Decimal("199.00"),
                maximum_discount=Decimal("30.00"),
                usage_limit=500,
                per_user_limit=5,
                is_active=True
            ))

        c3 = db.query(Coupon).filter(Coupon.code == "BIGBASKET50").first()
        if not c3:
            db.add(Coupon(
                code="BIGBASKET50",
                description="Flat ₹50 OFF on orders above ₹499",
                discount_type="fixed",
                discount_value=Decimal("50.00"),
                minimum_order=Decimal("499.00"),
                maximum_discount=Decimal("50.00"),
                usage_limit=500,
                per_user_limit=2,
                is_active=True
            ))

        db.commit()
        logger.info("Database seeding completed successfully! 🎉")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
