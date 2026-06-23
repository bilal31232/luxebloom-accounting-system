import { useState, useEffect } from 'react'
import { Plus, Search, Eye, X, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const PROJECT_ID = 'manasra-32b5e';
import.meta.env.VITE_FIREBASE_API_KEY
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// دوال التحويل الذكية
function parseFirestoreDoc(doc: any) {
  const id = doc.name.split('/').pop();
  const fields = doc.fields || {};
  const data: any = { id };
  for (const key in fields) {
    const valObj = fields[key];
    if ('stringValue' in valObj) data[key] = valObj.stringValue;
    else if ('integerValue' in valObj) data[key] = parseInt(valObj.integerValue);
    else if ('doubleValue' in valObj) data[key] = parseFloat(valObj.doubleValue);
    else if ('booleanValue' in valObj) data[key] = valObj.booleanValue;
    else if ('arrayValue' in valObj) {
      const values = valObj.arrayValue.values || [];
      data[key] = values.map((v: any) => {
        if (v.mapValue) {
          const mFields = v.mapValue.fields || {};
          const item: any = {};
          for (const mk in mFields) {
            if ('stringValue' in mFields[mk]) item[mk] = mFields[mk].stringValue;
            if ('integerValue' in mFields[mk]) item[mk] = parseInt(mFields[mk].integerValue);
            if ('doubleValue' in mFields[mk]) item[mk] = parseFloat(mFields[mk].doubleValue);
          }
          return item;
        }
        return v;
      });
    }
  }
  return data;
}

function toFirestoreFields(obj: any) {
  const fields: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') {
      if (Number.isInteger(val)) fields[key] = { integerValue: val.toString() };
      else fields[key] = { doubleValue: val };
    } else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: val.length > 0 ? {
          values: val.map(item => {
            const mapFields: any = {};
            for (const mk in item) {
              if (item[mk] === null || item[mk] === undefined) continue;
              if (typeof item[mk] === 'string') mapFields[mk] = { stringValue: item[mk] };
              else if (typeof item[mk] === 'number') {
                if (Number.isInteger(item[mk])) mapFields[mk] = { integerValue: item[mk].toString() };
                else mapFields[mk] = { doubleValue: Number(item[mk]) };
              }
              else if (typeof item[mk] === 'boolean') mapFields[mk] = { booleanValue: item[mk] };
            }
            return { mapValue: { fields: mapFields } };
          })
        } : {}
      };
    }
  }
  return fields;
}

export default function Purchases() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. جلب المنتجات بشكل لا نهائي
      let allProds: any[] = [];
      let prodToken = '';
      const prodLimitUrl = `${BASE_URL}/products?pageSize=300&key=${API_KEY}`;
      do {
        const url = prodToken ? `${prodLimitUrl}&pageToken=${prodToken}` : prodLimitUrl;
        const res = await fetch(url)
        if (res.status === 404) break;
        if (!res.ok) throw new Error("فشل الجلب");
        const data = await res.json()
        if (data.documents) {
          allProds = [...allProds, ...data.documents.map((d: any) => parseFirestoreDoc(d))];
        }
        prodToken = data.nextPageToken;
      } while (prodToken);
      setProducts(allProds);

      // 2. جلب المشتريات بشكل لا نهائي
      let allPurchases: any[] = [];
      let purToken = '';
      const purLimitUrl = `${BASE_URL}/purchases?pageSize=300&key=${API_KEY}`;
      do {
        const url = purToken ? `${purLimitUrl}&pageToken=${purToken}` : purLimitUrl;
        const res = await fetch(url)
        if (res.status === 404) break;
        if (!res.ok) throw new Error("فشل الجلب");
        const data = await res.json()
        if (data.documents) {
          allPurchases = [...allPurchases, ...data.documents.map((d: any) => parseFirestoreDoc(d))];
        }
        purToken = data.nextPageToken;
      } while (purToken);
      setInvoices(allPurchases);

    } catch (error) {
      console.error("خطأ في الجلب:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredInvoices = invoices
    .filter(inv => inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) || inv.supplierName?.includes(search))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">المشتريات</h1>
          <p className="text-white/50 text-sm mt-1">فواتير الشراء وإدخال المخزون</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="glass-button flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> فاتورة شراء جديدة
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-right">إدخال فاتورة مشتريات (تزويد المخزون)</DialogTitle>
            </DialogHeader>
            <PurchaseInvoiceForm 
              onSuccess={() => { setIsDialogOpen(false); fetchData(); }} 
              products={products} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="البحث برقم الفاتورة أو المورد..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pr-10" />
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="table-glass min-w-[800px]">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المورد</th>
              <th>التاريخ</th>
              <th>إجمالي التكلفة</th>
              <th>المدفوع</th>
              <th>المتبقي (دين)</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-white/50">جاري تحميل الفواتير...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-white/40">لا توجد فواتير مطابقة</td></tr>
            ) : (
              filteredInvoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="font-mono text-emerald-400">{inv.invoiceNo}</td>
                  <td>{inv.supplierName || 'مورد عام'}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString('ar-PS')}</td>
                  <td className="text-gold-400 font-medium">{Number(inv.totalCost || 0).toLocaleString()} ₪</td>
                  <td>{Number(inv.paid || 0).toLocaleString()} ₪</td>
                  <td className={(inv.totalCost - inv.paid) > 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {Number((inv.totalCost || 0) - (inv.paid || 0)).toLocaleString()} ₪
                  </td>
                  <td><span className="badge-success">مستلمة</span></td>
                  <td>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                          <Eye className="w-3.5 h-3.5 text-white/60" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="glass-panel border-white/10 max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white text-right">تفاصيل فاتورة الشراء {inv.invoiceNo}</DialogTitle>
                        </DialogHeader>
                        <PurchaseDetails invoice={inv} />
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PurchaseInvoiceForm({ onSuccess, products }: { onSuccess: () => void, products: any[] }) {
  const [isPending, setIsPending] = useState(false)
  const [items, setItems] = useState<Array<{ 
    itemType: string; 
    productId: string; 
    name: string; 
    size: string; 
    quantity: number; 
    unitCost: number; 
    total: number 
  }>>([])
  
  const [supplierName, setSupplierName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [paid, setPaid] = useState(0)

  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState('')

  const addItem = () => {
    setItems([...items, { itemType: '', productId: '', name: '', size: '', quantity: 1, unitCost: 0, total: 0 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'itemType') {
      newItems[index].productId = ''
      newItems[index].name = ''
      newItems[index].size = ''
      newItems[index].unitCost = 0
      newItems[index].total = 0
    }
    
    if (field === 'productId') {
      const product = products.find((p: any) => p.id === value)
      if (product) {
        newItems[index].name = product.name
        newItems[index].unitCost = Number(product.purchasePrice) || 0 // نسحب التكلفة القديمة للتسهيل
        newItems[index].size = '' 
        newItems[index].itemType = product.itemType || newItems[index].itemType 
      }
    }
    
    newItems[index].total = newItems[index].quantity * newItems[index].unitCost
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalCost = items.reduce((sum, item) => sum + item.total, 0)

  // التحديث التلقائي للمدفوع فقط إذا كان يساوي الإجمالي القديم (للتسهيل)
  useEffect(() => {
    setPaid(totalCost)
  }, [totalCost])

  const handleSubmit = async () => {
    if (items.length === 0) return alert("الرجاء إضافة منتجات للفاتورة")
    if (items.some(i => !i.productId)) return alert("الرجاء تحديد المنتج في جميع الصفوف")
    
    // التحقق من تحديد المقاس للمنتجات التي تمتلك مقاسات
    const missingSize = items.some(item => {
      const prod = products.find(p => p.id === item.productId)
      const hasSizes = prod?.variants && prod.variants.length > 0;
      return hasSizes && !item.size 
    })
    if (missingSize) return alert("الرجاء تحديد المقاس لجميع المنتجات التي تمتلك مقاسات!")
    
    setIsPending(true)
    try {
      const invoiceNo = `PUR-${Date.now().toString().slice(-6)}`
      
      const invoiceData = {
        invoiceNo,
        supplierName: supplierName || 'مورد عام',
        items,
        totalCost,
        paid,
        paymentMethod,
        notes,
        createdAt: new Date().toISOString()
      }

      // 1. حفظ فاتورة المشتريات
      const invoiceRes = await fetch(`${BASE_URL}/purchases?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(invoiceData) })
      })

      if (!invoiceRes.ok) throw new Error("فشل حفظ الفاتورة")

      // 2. تحديث المخزون (زيادة الكميات) بنظام updateMask
      for (const item of items) {
        const productData = products.find(p => p.id === item.productId)
        if (!productData) continue;

        // العملية هنا إضافة (+) وليست طرح
        const newQuantity = (Number(productData.quantity) || 0) + item.quantity
        const hasSizes = productData.variants && productData.variants.length > 0;
        
        let updateFields: any = { quantity: newQuantity }
        let updateUrl = `${BASE_URL}/products/${item.productId}?key=${API_KEY}&updateMask.fieldPaths=quantity`

        if (hasSizes && item.size) {
          updateFields.variants = productData.variants.map((v: any) => {
            // زيادة كمية المقاس المحدد
            if (v.size === item.size) return { ...v, quantity: (Number(v.quantity) || 0) + item.quantity }
            return v
          })
          updateUrl += `&updateMask.fieldPaths=variants`
        }

        const updateRes = await fetch(updateUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreFields(updateFields) })
        })

        if (!updateRes.ok) {
           console.error("خطأ في تحديث المخزون", await updateRes.text())
        }
      }

      onSuccess()
    } catch (error) {
      console.error("Error creating purchase: ", error)
      alert("حدث خطأ أثناء حفظ الفاتورة")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">اسم المورد</label>
          <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="glass-input w-full" placeholder="مورد عام..." />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">طريقة الدفع</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="glass-input w-full">
            <option value="CASH">نقدي</option>
            <option value="BANK_TRANSFER">تحويل بنكي</option>
            <option value="CREDIT_CARD">بطاقة ائتمان</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">ملاحظات الفاتورة</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="glass-input w-full" placeholder="ملاحظات..." />
        </div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-white">المنتجات (توريد للمخزون)</label>
          <button onClick={addItem} className="text-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> إضافة منتج للفاتورة
          </button>
        </div>
        
        <div className="space-y-3 max-h-[45vh] overflow-y-auto overflow-x-auto pr-2 custom-scrollbar">
          <div className="min-w-[700px] pb-2">
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.productId)
              const hasSizes = selectedProduct?.variants && selectedProduct.variants.length > 0
              const availableSizes = selectedProduct?.variants || []
              
              const availableProductsList = products.filter(p => 
                (item.itemType ? p.itemType === item.itemType : true)
              )

              return (
                <div key={index} className="glass p-3 rounded-lg border border-white/5 relative mb-2">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    
                    {/* فلتر النوع المحدث */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-white/40 mb-1 block">المعدن / الفئة</label>
                      <select value={item.itemType} onChange={(e) => updateItem(index, 'itemType', e.target.value)} className="glass-input w-full text-xs">
                        <option value="">الكل</option>
                        <option value="SILVER">فضة</option>
                        <option value="STEEL">ستانليس</option>
                        <option value="OTHER">أخرى (ساعات وعلب)</option>
                      </select>
                    </div>

                    <div className={hasSizes ? "col-span-3 relative" : "col-span-5 relative"}>
                      <label className="text-[10px] text-white/40 mb-1 block">المنتج (اختر لتزويد الكمية)</label>
                      <div className="relative">
                        <div 
                          className="glass-input w-full text-xs flex justify-between items-center cursor-pointer hover:bg-white/5"
                          onClick={() => { setOpenDropdownIdx(openDropdownIdx === index ? null : index); setProductSearchTerm(''); }}
                        >
                          <span className="truncate">{item.name || 'ابحث واضغط هنا...'}</span>
                          <ChevronDown className="w-3 h-3 text-white/40" />
                        </div>
                        
                        {openDropdownIdx === index && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 glass-panel border border-white/10 rounded-lg max-h-48 flex flex-col overflow-hidden">
                            <input 
                              autoFocus
                              type="text" 
                              placeholder="ابحث عن منتج..." 
                              className="bg-transparent border-b border-white/10 p-2 text-xs text-white outline-none"
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                            <div className="overflow-y-auto">
                              {availableProductsList
                                .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.code?.includes(productSearchTerm))
                                .map(p => (
                                  <div 
                                    key={p.id} 
                                    className="p-2 text-xs hover:bg-white/10 cursor-pointer flex justify-between items-center"
                                    onClick={() => { updateItem(index, 'productId', p.id); setOpenDropdownIdx(null); }}
                                  >
                                    <span>{p.name}</span>
                                    <span className="text-white/40 text-[10px]">حالي: {p.quantity}</span>
                                  </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {hasSizes && (
                      <div className="col-span-2">
                        <label className="text-[10px] text-emerald-400 mb-1 block">المقاس (للتزويد)</label>
                        <select value={item.size} onChange={(e) => updateItem(index, 'size', e.target.value)} className="glass-input w-full text-xs border-emerald-500/50" required>
                          <option value="">اختر مقاس</option>
                          {availableSizes.map((v: any, i: number) => (
                              <option key={i} value={v.size}>مقاس {v.size}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="text-[10px] text-white/40 mb-1 block">الكمية (الداخلة)</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="glass-input w-full text-xs text-center border-emerald-500/30" />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-white/40 mb-1 block">تكلفة الشراء للقطعة</label>
                      <input type="number" value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)} className="glass-input w-full text-xs" />
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2 pb-1">
                      <span className="text-sm font-medium text-emerald-400 min-w-[3rem] text-center">{item.total} ₪</span>
                      <button onClick={() => removeItem(index)} className="w-7 h-7 flex-shrink-0 rounded bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">المبلغ المدفوع للمورد</label>
          <input type="number" value={paid} onChange={(e) => setPaid(parseFloat(e.target.value) || 0)} className="glass-input w-full text-emerald-400 font-bold" />
        </div>
      </div>

      <div className="glass p-5 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between mt-6 bg-gradient-to-l from-emerald-500/10 to-transparent">
        <div>
          <p className="text-sm text-white/60">إجمالي فاتورة الشراء</p>
          <p className="text-3xl font-bold text-emerald-400">{totalCost.toLocaleString()} شيكل</p>
          {(totalCost - paid) > 0 && <p className="text-sm text-red-400 mt-1">الدين المتبقي للمورد: {(totalCost - paid).toLocaleString()} شيكل</p>}
        </div>
        <button onClick={handleSubmit} className="glass-button w-full sm:w-auto px-8 py-3 text-lg mt-4 sm:mt-0 !bg-emerald-600 hover:!bg-emerald-500" disabled={isPending || items.length === 0}>
          {isPending ? 'جاري الإدخال للمخزون...' : 'تأكيد وإدخال للمخزون'}
        </button>
      </div>
    </div>
  )
}

function PurchaseDetails({ invoice }: { invoice: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-3 rounded-lg">
          <p className="text-xs text-white/50">رقم الفاتورة</p>
          <p className="text-sm font-medium text-emerald-400">{invoice.invoiceNo}</p>
        </div>
        <div className="glass p-3 rounded-lg">
          <p className="text-xs text-white/50">تاريخ الشراء</p>
          <p className="text-sm font-medium text-white/90">{new Date(invoice.createdAt).toLocaleString('ar-PS')}</p>
        </div>
        <div className="glass p-3 rounded-lg col-span-2">
          <p className="text-xs text-white/50">المورد</p>
          <p className="text-sm font-medium text-white/90">{invoice.supplierName || 'مورد عام'}</p>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="table-glass min-w-[500px]">
          <thead>
            <tr>
              <th>المنتج المورد</th>
              <th className="text-center">الكمية المدخلة</th>
              <th className="text-center">تكلفة القطعة</th>
              <th className="text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="text-[11px] text-white/50 mt-1">
                      النوع: {item.itemType === 'SILVER' ? 'فضة' : item.itemType === 'STEEL' ? 'ستانليس' : 'غير محدد'} 
                      {item.size && ` | المقاس: ${item.size}`}
                    </span>
                  </div>
                </td>
                <td className="text-center text-emerald-400 font-bold">+{item.quantity}</td>
                <td className="text-center text-white/90">{Number(item.unitCost || 0).toLocaleString()} ₪</td>
                <td className="text-left text-white font-medium">{Number(item.total || 0).toLocaleString()} ₪</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass p-4 rounded-lg space-y-3 border border-white/5">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-white">إجمالي التكلفة</span>
          <span className="text-emerald-400">{Number(invoice.totalCost || 0).toLocaleString()} شيكل</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-white/60">المدفوع للمورد</span>
          <span className="text-white/90">{Number(invoice.paid || 0).toLocaleString()} شيكل</span>
        </div>
        {(Number(invoice.totalCost) - Number(invoice.paid)) > 0 && (
          <div className="flex justify-between text-sm pt-1">
            <span className="text-white/60">الدين المتبقي للمورد</span>
            <span className="text-red-400">{Number((invoice.totalCost || 0) - (invoice.paid || 0)).toLocaleString()} شيكل</span>
          </div>
        )}
      </div>
    </div>
  )
}