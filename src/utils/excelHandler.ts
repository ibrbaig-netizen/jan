import * as XLSX from 'xlsx';
import { DepartmentId, Product } from '../types';

export interface ParseResult {
  validProducts: Product[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

const VALID_DEPARTMENTS: DepartmentId[] = [
  'cosmetics',
  'grocery',
  'drinks',
  'lingerie',
  'toiletries',
  'toys',
  'birthday-items',
  'crockery',
  'electronics',
  'pharmacy'
];

/**
 * Normalizes input string to a valid department id
 */
function normalizeDepartment(raw: any): DepartmentId {
  if (!raw) return 'grocery';
  const str = String(raw).toLowerCase().trim().replace(/\s+/g, '-');
  
  if (VALID_DEPARTMENTS.includes(str as DepartmentId)) {
    return str as DepartmentId;
  }
  if (str.includes('cosmetic') || str.includes('beauty') || str.includes('makeup')) return 'cosmetics';
  if (str.includes('grocer') || str.includes('food') || str.includes('pantry') || str.includes('ration')) return 'grocery';
  if (str.includes('drink') || str.includes('beverage') || str.includes('juice') || str.includes('water') || str.includes('soda')) return 'drinks';
  if (str.includes('linger') || str.includes('undergarment') || str.includes('bra') || str.includes('innerwear')) return 'lingerie';
  if (str.includes('toiletr') || str.includes('hygiene') || str.includes('soap') || str.includes('shampoo')) return 'toiletries';
  if (str.includes('toy') || str.includes('game') || str.includes('kid')) return 'toys';
  if (str.includes('birth') || str.includes('party') || str.includes('balloon') || str.includes('decor')) return 'birthday-items';
  if (str.includes('crock') || str.includes('kitchen') || str.includes('dinner') || str.includes('glass') || str.includes('cup')) return 'crockery';
  if (str.includes('electr') || str.includes('gadget') || str.includes('tech') || str.includes('trimmer') || str.includes('charger')) return 'electronics';
  if (str.includes('pharm') || str.includes('medic') || str.includes('drug') || str.includes('health')) return 'pharmacy';

  return 'grocery';
}

/**
 * Download standard Excel template with pre-filled sample rows
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Product Name': 'Maybelline Fit Me Matte Foundation',
      'Department': 'cosmetics',
      'Category': 'Foundation',
      'Price (PKR)': 2450,
      'Original Price': 2850,
      'Stock Quantity': 35,
      'Unit': '30ml Bottle',
      'SKU': 'MAY-FIT-001',
      'Barcode': '041554433418',
      'Description': '100% Original imported foundation with poreless matte finish.',
      'Image URL': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': 'Bestseller'
    },
    {
      'Product Name': "Olper's Full Cream Milk 1 Litre",
      'Department': 'grocery',
      'Category': 'Dairy',
      'Price (PKR)': 360,
      'Original Price': 380,
      'Stock Quantity': 100,
      'Unit': '1 Litre Tetra Pack',
      'SKU': 'OLP-1L-002',
      'Barcode': '8964000318012',
      'Description': 'Pure rich homogenized dairy milk for everyday family vitality.',
      'Image URL': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': 'Daily Fresh'
    },
    {
      'Product Name': 'Red Bull Energy Drink Classic Can',
      'Department': 'drinks',
      'Category': 'Energy Drinks',
      'Price (PKR)': 490,
      'Original Price': 550,
      'Stock Quantity': 50,
      'Unit': '250ml Can',
      'SKU': 'RDB-250-003',
      'Barcode': '9002490100070',
      'Description': 'Original Austrian energy drink vitalizes mind and body.',
      'Image URL': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': 'Chilled'
    },
    {
      'Product Name': 'Sensodyne Rapid Relief Toothpaste',
      'Department': 'toiletries',
      'Category': 'Oral Care',
      'Price (PKR)': 680,
      'Original Price': 750,
      'Stock Quantity': 45,
      'Unit': '100g Tube',
      'SKU': 'SEN-RAP-004',
      'Barcode': '5054563032737',
      'Description': 'Clinically proven fast relief for sensitive teeth within 60 seconds.',
      'Image URL': 'https://images.unsplash.com/photo-1559591937-e1032b4a1b02?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': 'Original'
    },
    {
      'Product Name': 'Metallic Chrome Balloon Arch Kit 100pcs',
      'Department': 'birthday-items',
      'Category': 'Balloon Arches',
      'Price (PKR)': 1650,
      'Original Price': 2100,
      'Stock Quantity': 30,
      'Unit': '100 Pcs Kit',
      'SKU': 'BAL-100-005',
      'Barcode': '896800192831',
      'Description': 'Luxury emerald and gold chrome balloons with arch garland strip.',
      'Image URL': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': 'Party Favorite'
    },
    {
      'Product Name': 'Philips 9-in-1 Multigroom Beard Trimmer',
      'Department': 'electronics',
      'Category': 'Personal Grooming',
      'Price (PKR)': 6850,
      'Original Price': 7900,
      'Stock Quantity': 15,
      'Unit': 'Box Set',
      'SKU': 'PHI-TRM-006',
      'Barcode': '8710103859345',
      'Description': 'Self-sharpening blades with up to 70 mins runtime. Genuine Philips guarantee.',
      'Image URL': 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500',
      'In Stock (TRUE/FALSE)': 'TRUE',
      'Badge': '100% Genuine'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for user convenience
  worksheet['!cols'] = [
    { wch: 38 }, // Product Name
    { wch: 18 }, // Department
    { wch: 20 }, // Category
    { wch: 14 }, // Price
    { wch: 14 }, // Original Price
    { wch: 14 }, // Stock
    { wch: 20 }, // Unit
    { wch: 16 }, // SKU
    { wch: 18 }, // Barcode
    { wch: 45 }, // Description
    { wch: 40 }, // Image URL
    { wch: 15 }, // In Stock
    { wch: 16 }  // Badge
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jan Chemist Products');

  // Also add instructions sheet
  const instructionData = [
    { 'Rule / Column': 'Departments Allowed', 'Details': 'cosmetics, grocery, drinks, lingerie, toiletries, toys, birthday-items, crockery, electronics, pharmacy' },
    { 'Rule / Column': 'Price (PKR)', 'Details': 'Numbers only without symbols, e.g. 1500' },
    { 'Rule / Column': 'In Stock', 'Details': 'TRUE or FALSE (default is TRUE)' },
    { 'Rule / Column': 'Images', 'Details': 'Direct image URLs (https://...). If left blank, a department fallback photo is automatically used.' },
    { 'Rule / Column': 'Tagline & Brand Guarantee', 'Details': '"With us its original" - All items will have the 100% Original badge active.' }
  ];
  const instrSheet = XLSX.utils.json_to_sheet(instructionData);
  instrSheet['!cols'] = [{ wch: 25 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Import Guidelines');

  XLSX.writeFile(workbook, 'Jan_Chemist_Product_Upload_Template.xlsx');
}

/**
 * Export current inventory list to an Excel spreadsheet
 */
export function exportProductsToExcel(products: Product[]): void {
  const exportData = products.map(p => ({
    'ID': p.id,
    'Product Name': p.name,
    'Department': p.department,
    'Category': p.category,
    'Price (PKR)': p.price,
    'Original Price': p.originalPrice || p.price,
    'Stock Quantity': p.stock,
    'Unit': p.unit,
    'SKU': p.sku,
    'Barcode': p.barcode || '',
    'In Stock': p.inStock ? 'TRUE' : 'FALSE',
    'Badge': p.badge || '',
    'Description': p.description,
    'Image URL': p.image
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 45 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Catalog');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Jan_Chemist_Inventory_${dateStr}.xlsx`);
}

/**
 * Parses an Excel or CSV file from user upload
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      validProducts: [],
      errors: ['The selected spreadsheet has no sheets.'],
      warnings: [],
      totalRows: 0
    };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validProducts: Product[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const defaultDeptImages: Record<DepartmentId, string> = {
    'cosmetics': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
    'grocery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
    'drinks': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
    'lingerie': 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=500',
    'toiletries': 'https://images.unsplash.com/photo-1559591937-e1032b4a1b02?w=500',
    'toys': 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500',
    'birthday-items': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500',
    'crockery': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500',
    'electronics': 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500',
    'pharmacy': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
    'all': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'
  };

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row
    
    // Normalize keys
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      normalized[cleanKey] = row[key];
    }

    const name = normalized['productname'] || normalized['name'] || normalized['itemname'] || normalized['title'];
    if (!name || String(name).trim() === '') {
      errors.push(`Row ${rowNum}: Skipped because "Product Name" is missing.`);
      return;
    }

    const rawPrice = normalized['pricepkr'] || normalized['price'] || normalized['rate'] || normalized['mrp'] || 0;
    const priceNum = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      warnings.push(`Row ${rowNum}: Invalid price for "${name}". Defaulted to Rs. 100.`);
    }
    const finalPrice = !isNaN(priceNum) && priceNum > 0 ? Math.round(priceNum) : 100;

    const rawOrigPrice = normalized['originalprice'] || normalized['mrp'] || normalized['listprice'];
    let originalPrice: number | undefined = undefined;
    if (rawOrigPrice) {
      const p = parseFloat(String(rawOrigPrice).replace(/[^0-9.]/g, ''));
      if (!isNaN(p) && p > finalPrice) {
        originalPrice = Math.round(p);
      }
    }

    const deptRaw = normalized['department'] || normalized['dept'] || normalized['category'];
    const department = normalizeDepartment(deptRaw);

    const rawStock = normalized['stockquantity'] || normalized['stock'] || normalized['qty'] || normalized['quantity'];
    const stockNum = parseInt(String(rawStock).replace(/[^0-9-]/g, ''), 10);
    const finalStock = isNaN(stockNum) ? 20 : Math.max(0, stockNum);

    const unit = normalized['unit'] || normalized['pack'] || normalized['size'] || 'Piece';
    const sku = normalized['sku'] || normalized['code'] || `JAN-${department.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${idx}`;
    const barcode = normalized['barcode'] ? String(normalized['barcode']).trim() : undefined;
    const category = normalized['category'] || 'General';
    const description = normalized['description'] || `${name} - 100% Genuine original quality guaranteed at Jan Chemist.`;
    
    let image = normalized['imageurl'] || normalized['image'] || normalized['photo'] || '';
    if (!image || !String(image).startsWith('http')) {
      image = defaultDeptImages[department];
    }

    const inStockVal = normalized['instocktruefalse'] ?? normalized['instock'] ?? normalized['available'];
    const inStock = String(inStockVal).toLowerCase() !== 'false' && finalStock > 0;

    const badge = normalized['badge'] || (originalPrice ? 'Sale' : undefined);

    validProducts.push({
      id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: String(name).trim(),
      department,
      category: String(category).trim(),
      price: finalPrice,
      originalPrice,
      stock: finalStock,
      unit: String(unit).trim(),
      sku: String(sku).trim(),
      barcode,
      description: String(description).trim(),
      image: String(image).trim(),
      inStock,
      isOriginalGuaranteed: true,
      badge: badge ? String(badge).trim() : undefined,
      rating: 4.8 + Math.floor(Math.random() * 3) / 10,
      reviewsCount: 15 + Math.floor(Math.random() * 80)
    });
  });

  return {
    validProducts,
    errors,
    warnings,
    totalRows: rawRows.length
  };
}
