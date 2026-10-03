import { DepartmentInfo } from '../types';

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'cosmetics',
    name: 'Cosmetics & Beauty',
    shortName: 'Cosmetics',
    description: '100% Original makeup, skincare serums, perfumes & luxury haircare',
    tagline: '100% Original Luxury Beauty & Skincare',
    iconName: 'Sparkles',
    bgGradient: 'from-pink-500 to-rose-600',
    accentColor: '#db2777',
    image: '/departments/skin-care.svg',
    sampleCategories: ['Skincare', 'Lipsticks', 'Foundation', 'Perfumes', 'Hair Care']
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Prescriptions',
    shortName: 'Pharmacy',
    description: '100% Genuine OTC medicines, vitamins, first aid & prescription dispatch',
    tagline: 'Certified Medicines & Health Care',
    iconName: 'Pill',
    bgGradient: 'from-emerald-600 to-teal-700',
    accentColor: '#059669',
    image: '/departments/vitamins-supplements.svg',
    sampleCategories: ['Pain Relief', 'Multivitamins', 'First Aid', 'Prescriptions Rx', 'Cough & Cold', 'Diabetic Care']
  },
  {
    id: 'grocery',
    name: 'Grocery & Staples',
    shortName: 'Grocery',
    description: 'Fresh packaged essentials, pure cooking oils, basmati rice & pantry',
    tagline: 'Pantry Essentials & Cooking Oils',
    iconName: 'ShoppingBag',
    bgGradient: 'from-amber-500 to-orange-600',
    accentColor: '#d97706',
    image: '/departments/food-staples.svg',
    sampleCategories: ['Cooking Oil', 'Rice & Flour', 'Spices', 'Breakfast', 'Dairy', 'Bakery']
  },
  {
    id: 'drinks',
    name: 'Drinks & Beverages',
    shortName: 'Drinks',
    description: 'Chilled energy drinks, mineral water, traditional syrups & juices',
    tagline: 'Chilled Refreshments & Syrups',
    iconName: 'Coffee',
    bgGradient: 'from-cyan-500 to-blue-600',
    accentColor: '#0284c7',
    image: '/departments/beverages.svg',
    sampleCategories: ['Energy Drinks', 'Soft Drinks', 'Mineral Water', 'Juices', 'Tea & Coffee']
  },
  {
    id: 'toiletries',
    name: 'Toiletries & Hygiene',
    shortName: 'Toiletries',
    description: 'Oral health, antibacterial soaps, shampoos, body washes & sanitizers',
    tagline: 'Personal Hygiene & Family Care',
    iconName: 'Bath',
    bgGradient: 'from-teal-500 to-emerald-600',
    accentColor: '#0d9488',
    image: '/departments/personal-care.svg',
    sampleCategories: ['Oral Care', 'Shampoo & Soaps', 'Deodorants', 'Body Wash', 'Hand Sanitizers']
  },
  {
    id: 'lingerie',
    name: 'Lingerie & Innerwear',
    shortName: 'Lingerie',
    description: 'Premium comfort bras, cotton briefs, nightwear & thermal intimates',
    tagline: 'Premium Comfort Intimates',
    iconName: 'HeartHandshake',
    bgGradient: 'from-purple-500 to-indigo-600',
    accentColor: '#7c3aed',
    image: '/departments/feminine-care.svg',
    sampleCategories: ['Bras', 'Panties & Briefs', 'Nightwear', 'Shapewear', 'Thermals']
  },
  {
    id: 'toys',
    name: 'Toys & Kids Games',
    shortName: 'Toys',
    description: 'Educational building blocks, RC stunt cars, dolls & board games',
    tagline: 'Kids Fun & Educational Games',
    iconName: 'Gamepad2',
    bgGradient: 'from-yellow-400 to-amber-500',
    accentColor: '#eab308',
    image: '/departments/toys.svg',
    sampleCategories: ['Action & RC Cars', 'Building Blocks', 'Dolls & Playsets', 'Board Games', 'Baby Toys', 'Diapering']
  },
  {
    id: 'birthday-items',
    name: 'Birthday Items & Party',
    shortName: 'Birthday Items',
    description: 'Balloons, metallic arches, cake sparklers, poppers, caps & banners',
    tagline: 'Balloons, Sparklers & Decor',
    iconName: 'Gift',
    bgGradient: 'from-fuchsia-500 to-pink-600',
    accentColor: '#c026d3',
    image: '/departments/chocolates-snacks.svg',
    sampleCategories: ['Balloon Arches', 'Cake Toppers & Candles', 'Party Poppers', 'Banners & Decor', 'Foil Balloons']
  },
  {
    id: 'crockery',
    name: 'Crockery & Kitchenware',
    shortName: 'Crockery',
    description: 'Fine bone china dinner sets, glassware, cutlery & non-stick cookware',
    tagline: 'Dinner Sets & Fine Glassware',
    iconName: 'UtensilsCrossed',
    bgGradient: 'from-slate-600 to-zinc-800',
    accentColor: '#475569',
    image: '/departments/laundry-household.svg',
    sampleCategories: ['Dinner Sets', 'Glassware & Mugs', 'Cutlery', 'Cookware Pans', 'Serving Trays']
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    shortName: 'Electronics',
    description: 'Beard trimmers, ionic hair dryers, 20W chargers, cables & power banks',
    tagline: 'Grooming Gadgets & Fast Chargers',
    iconName: 'Zap',
    bgGradient: 'from-blue-600 to-indigo-700',
    accentColor: '#2563eb',
    image: '/departments/equipment-supplies.svg',
    sampleCategories: ['Personal Grooming', 'Fast Chargers', 'Power Banks', 'Batteries & Bulbs', 'Hair Stylers']
  }
];

export interface SubDepartmentCard {
  id: string;
  name: string;
  parentDept: string;
  image: string;
}

export const ALL_SUB_DEPARTMENTS: SubDepartmentCard[] = [
  { id: 'beverages', name: 'Beverages', parentDept: 'drinks', image: '/departments/beverages.svg' },
  { id: 'personal-care', name: 'Personal Care', parentDept: 'toiletries', image: '/departments/personal-care.svg' },
  { id: 'skin-care', name: 'Skin Care', parentDept: 'cosmetics', image: '/departments/skin-care.svg' },
  { id: 'makeup', name: 'Makeup', parentDept: 'cosmetics', image: '/departments/makeup.svg' },
  { id: 'vitamins-supplements', name: 'Vitamins & Supplements', parentDept: 'pharmacy', image: '/departments/vitamins-supplements.svg' },
  { id: 'bread-bakery', name: 'Bread & Bakery', parentDept: 'grocery', image: '/departments/bread-bakery.svg' },
  { id: 'toys', name: 'Toys', parentDept: 'toys', image: '/departments/toys.svg' },
  { id: 'diabetic-products', name: 'Diabetic Products', parentDept: 'pharmacy', image: '/departments/diabetic-products.svg' },
  { id: 'food-staples', name: 'Food Staples', parentDept: 'grocery', image: '/departments/food-staples.svg' },
  { id: 'dairy', name: 'Dairy', parentDept: 'grocery', image: '/departments/dairy.svg' },
  { id: 'men-care', name: 'Men & Care', parentDept: 'toiletries', image: '/departments/men-care.svg' },
  { id: 'feminine-care', name: 'Feminine Care', parentDept: 'lingerie', image: '/departments/feminine-care.svg' },
  { id: 'herbal', name: 'Herbal', parentDept: 'pharmacy', image: '/departments/herbal.svg' },
  { id: 'baby-care', name: 'Baby Care', parentDept: 'toys', image: '/departments/baby-care.svg' },
  { id: 'baby-foods', name: 'Baby Foods', parentDept: 'grocery', image: '/departments/baby-foods.svg' },
  { id: 'diapering-napping', name: 'Diapering & Napping', parentDept: 'toys', image: '/departments/diapering-napping.svg' },
  { id: 'laundry-household', name: 'Laundry & Household', parentDept: 'crockery', image: '/departments/laundry-household.svg' },
  { id: 'chocolates-snacks', name: 'Chocolates & Snacks', parentDept: 'birthday-items', image: '/departments/chocolates-snacks.svg' },
  { id: 'candies-bubble-gum', name: 'Candies & Gum', parentDept: 'birthday-items', image: '/departments/candies-bubble-gum.svg' },
  { id: 'breakfast', name: 'Breakfast', parentDept: 'grocery', image: '/departments/breakfast.svg' },
  { id: 'equipment-supplies', name: 'Equipment & Supplies', parentDept: 'electronics', image: '/departments/equipment-supplies.svg' },
  { id: 'pet-care', name: 'Pet Care', parentDept: 'grocery', image: '/departments/pet-care.svg' }
];
