import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      name: 'مدير النظام',
      email: 'admin@silversteel.com',
      role: 'ADMIN',
    },
  })
  console.log('Created admin user:', admin.username)

  // Create categories
  const categories = await prisma.category.createMany({
    data: [
      { name: 'خواتم فضة', nameEn: 'Silver Rings', type: 'SILVER', color: '#C0C0C0' },
      { name: 'سلاسل فضة', nameEn: 'Silver Chains', type: 'SILVER', color: '#D4D4D4' },
      { name: 'أساور فضة', nameEn: 'Silver Bracelets', type: 'SILVER', color: '#E8E8E8' },
      { name: 'حلقان فضة', nameEn: 'Silver Earrings', type: 'SILVER', color: '#B0B0B0' },
      { name: 'خواتم ستيل', nameEn: 'Steel Rings', type: 'STEEL', color: '#4A5568' },
      { name: 'سلاسل ستيل', nameEn: 'Steel Chains', type: 'STEEL', color: '#5A6578' },
      { name: 'أساور ستيل', nameEn: 'Steel Bracelets', type: 'STEEL', color: '#6A7588' },
      { name: 'ساعات ستيل', nameEn: 'Steel Watches', type: 'STEEL', color: '#7A8598' },
    ],
  })
  console.log('Created', categories.count, 'categories')

  // Create expense categories
  const expenseCategories = await prisma.expenseCategory.createMany({
    data: [
      { name: 'إيجار', nameEn: 'Rent', color: '#E53E3E' },
      { name: 'رواتب', nameEn: 'Salaries', color: '#3182CE' },
      { name: 'كهرباء', nameEn: 'Electricity', color: '#DD6B20' },
      { name: 'ماء', nameEn: 'Water', color: '#38B2AC' },
      { name: 'صيانة', nameEn: 'Maintenance', color: '#805AD5' },
      { name: 'تسويق', nameEn: 'Marketing', color: '#D69E2E' },
      { name: 'نقل', nameEn: 'Transportation', color: '#319795' },
      { name: 'أخرى', nameEn: 'Others', color: '#718096' },
    ],
  })
  console.log('Created', expenseCategories.count, 'expense categories')

  // Create sample products
  const products = await prisma.product.createMany({
    data: [
      { code: 'SR-001', name: 'خاتم فضة عيار 925 كلاسيك', nameEn: 'Classic 925 Silver Ring', categoryId: 1, itemType: 'SILVER', unit: 'PIECE', quantity: 25, weightGram: 150, minQuantity: 5, minWeight: 50, purchasePrice: 120, salePrice: 180, wholesalePrice: 150, purity: '925' },
      { code: 'SR-002', name: 'خاتم فضة مطعم زركون', nameEn: 'Zircon Silver Ring', categoryId: 1, itemType: 'SILVER', unit: 'PIECE', quantity: 18, weightGram: 120, minQuantity: 5, minWeight: 40, purchasePrice: 200, salePrice: 320, wholesalePrice: 260, purity: '925' },
      { code: 'SC-001', name: 'سلسلة فضة إيطالي 925', nameEn: 'Italian 925 Silver Chain', categoryId: 2, itemType: 'SILVER', unit: 'PIECE', quantity: 15, weightGram: 300, minQuantity: 3, minWeight: 100, purchasePrice: 350, salePrice: 520, wholesalePrice: 430, purity: '925' },
      { code: 'SB-001', name: 'سوار فضة محفور 925', nameEn: 'Engraved 925 Silver Bracelet', categoryId: 3, itemType: 'SILVER', unit: 'PIECE', quantity: 12, weightGram: 200, minQuantity: 4, minWeight: 60, purchasePrice: 280, salePrice: 420, wholesalePrice: 340, purity: '925' },
      { code: 'SE-001', name: 'حلق فضة مرصع زركون', nameEn: 'Zircon Silver Earrings', categoryId: 4, itemType: 'SILVER', unit: 'PIECE', quantity: 30, weightGram: 80, minQuantity: 10, minWeight: 30, purchasePrice: 150, salePrice: 250, wholesalePrice: 200, purity: '925' },
      { code: 'NR-001', name: 'خاتم ستيل طبي كلاسيك', nameEn: 'Classic Medical Steel Ring', categoryId: 5, itemType: 'STEEL', unit: 'PIECE', quantity: 40, weightGram: 100, minQuantity: 10, minWeight: 50, purchasePrice: 45, salePrice: 85, wholesalePrice: 65 },
      { code: 'NC-001', name: 'سلسلة ستيل إيطالي', nameEn: 'Italian Steel Chain', categoryId: 6, itemType: 'STEEL', unit: 'PIECE', quantity: 22, weightGram: 180, minQuantity: 5, minWeight: 80, purchasePrice: 80, salePrice: 150, wholesalePrice: 110 },
      { code: 'NB-001', name: 'سوار ستيل مطلي ذهب', nameEn: 'Gold Plated Steel Bracelet', categoryId: 7, itemType: 'STEEL', unit: 'PIECE', quantity: 20, weightGram: 160, minQuantity: 5, minWeight: 60, purchasePrice: 95, salePrice: 180, wholesalePrice: 130 },
      { code: 'NW-001', name: 'ساعة ستيل رجالي فاخرة', nameEn: 'Luxury Men Steel Watch', categoryId: 8, itemType: 'STEEL', unit: 'PIECE', quantity: 10, weightGram: 250, minQuantity: 3, minWeight: 100, purchasePrice: 450, salePrice: 750, wholesalePrice: 580 },
      { code: 'SR-003', name: 'خاتم فضة زفاف فاخر', nameEn: 'Luxury Wedding Silver Ring', categoryId: 1, itemType: 'SILVER', unit: 'PIECE', quantity: 8, weightGram: 200, minQuantity: 3, minWeight: 80, purchasePrice: 500, salePrice: 850, wholesalePrice: 650, purity: '925' },
    ],
  })
  console.log('Created', products.count, 'products')

  // Create sample customers
  const customers = await prisma.customer.createMany({
    data: [
      { code: 'C-001', name: 'أحمد محمد', phone: '0501234567', city: 'الرياض', balance: 2500 },
      { code: 'C-002', name: 'خالد عبدالله', phone: '0559876543', city: 'جدة', balance: 1200 },
      { code: 'C-003', name: 'محمد العلي', phone: '0561112223', city: 'الدمام', balance: 0 },
      { code: 'C-004', name: 'فهد السالم', phone: '0574445556', city: 'الرياض', balance: 3800 },
      { code: 'C-005', name: 'عبدالرحمن الشمري', phone: '0587778889', city: 'مكة', balance: 900 },
    ],
  })
  console.log('Created', customers.count, 'customers')

  // Create sample suppliers
  const suppliers = await prisma.supplier.createMany({
    data: [
      { code: 'S-001', name: 'شركة الفضة الذهبية', phone: '0114455667', city: 'الرياض', balance: 15000 },
      { code: 'S-002', name: 'مصنع الستانليس العالمي', phone: '0135566778', city: 'جدة', balance: 8500 },
      { code: 'S-003', name: 'شركة الإكسسوارات الفاخرة', phone: '0146677889', city: 'الدمام', balance: 0 },
    ],
  })
  console.log('Created', suppliers.count, 'suppliers')

  // Create accounting accounts
  const accounts = await prisma.account.createMany({
    data: [
      { code: '1000', name: 'الأصول', type: 'ASSET' },
      { code: '1100', name: 'النقدية', type: 'ASSET', parentId: 1 },
      { code: '1200', name: 'المخزون', type: 'ASSET', parentId: 1 },
      { code: '1300', name: 'ذمم العملاء', type: 'ASSET', parentId: 1 },
      { code: '2000', name: 'الخصوم', type: 'LIABILITY' },
      { code: '2100', name: 'ذمم الموردين', type: 'LIABILITY', parentId: 5 },
      { code: '3000', name: 'حقوق الملكية', type: 'EQUITY' },
      { code: '4000', name: 'الإيرادات', type: 'REVENUE' },
      { code: '4100', name: 'مبيعات الفضة', type: 'REVENUE', parentId: 8 },
      { code: '4200', name: 'مبيعات الستانليس', type: 'REVENUE', parentId: 8 },
      { code: '5000', name: 'المصروفات', type: 'EXPENSE' },
      { code: '5100', name: 'تكلفة البضاعة المباعة', type: 'EXPENSE', parentId: 11 },
      { code: '5200', name: 'مصاريف الإيجار', type: 'EXPENSE', parentId: 11 },
      { code: '5300', name: 'الرواتب', type: 'EXPENSE', parentId: 11 },
    ],
  })
  console.log('Created', accounts.count, 'accounts')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
