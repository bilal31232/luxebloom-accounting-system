import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Truck, Phone, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const PROJECT_ID = 'manasra-32b5e';
import.meta.env.VITE_FIREBASE_API_KEY
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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
  }
  return data;
}

function toFirestoreFields(obj: any) {
  const fields: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') {
      if (Number.isInteger(val)) fields[key] = { integerValue: val.toString() };
      else fields[key] = { doubleValue: val };
    } else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
  }
  return fields;
}

const fetchAllDocs = async (collectionName: string) => {
  let allDocs: any[] = [];
  let pageToken = '';
  do {
    const url = pageToken 
      ? `${BASE_URL}/${collectionName}?pageSize=300&key=${API_KEY}&pageToken=${pageToken}` 
      : `${BASE_URL}/${collectionName}?pageSize=300&key=${API_KEY}`;
    
    const res = await fetch(url);
    if (res.status === 404) break;
    const data = await res.json();
    if (data.documents) {
      allDocs = [...allDocs, ...data.documents.map(parseFirestoreDoc)];
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return allDocs;
}

export default function Suppliers() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAllDocs('suppliers')
      setSuppliers(data)
    } catch (error) {
      console.error("خطأ في جلب الموردين:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredSuppliers = suppliers
    .filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.company?.includes(search))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // حساب إجمالي الديون اللي علينا للموردين
  const totalDebt = suppliers.reduce((sum, s) => sum + (Number(s.debt) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-violet-400">الموردين والشركات</h1>
          <p className="text-white/50 text-sm mt-1">إدارة بيانات المصانع، وتجار الجملة، والذمم المالية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="glass-button flex items-center justify-center gap-2 w-full sm:w-auto !bg-violet-500/20 !text-violet-400 hover:!bg-violet-500/30 !border-violet-500/30">
              <Plus className="w-4 h-4" /> إضافة مورد جديد
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-xl w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-white text-right">تسجيل بيانات مورد</DialogTitle>
            </DialogHeader>
            <SupplierForm 
              onSuccess={() => { setIsDialogOpen(false); fetchData(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass p-4 rounded-xl relative">
          <Search className="absolute right-7 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="البحث باسم المورد أو الشركة..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pr-10" />
        </div>
        <div className="glass p-4 rounded-xl border border-violet-500/20 bg-gradient-to-l from-violet-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">إجمالي الديون للموردين (علينا)</p>
            <p className="text-2xl font-bold text-violet-400">{totalDebt.toLocaleString()} ₪</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-violet-400" />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="table-glass min-w-[800px]">
          <thead>
            <tr>
              <th>اسم المورد / المندوب</th>
              <th>الشركة / المصنع</th>
              <th>رقم الهاتف</th>
              <th>تاريخ التسجيل</th>
              <th>الرصيد (دين له)</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-white/50">جاري تحميل الموردين...</td></tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-white/40">لا يوجد موردين مسجلين</td></tr>
            ) : (
              filteredSuppliers.map((supplier: any) => (
                <tr key={supplier.id}>
                  <td className="font-medium text-white">{supplier.name}</td>
                  <td>
                    <span className="text-xs bg-white/5 text-white/80 px-2 py-1 rounded border border-white/10">
                      {supplier.company || 'مورد عام'}
                    </span>
                  </td>
                  <td className="text-white/80 font-mono tracking-wider">{supplier.phone || '-'}</td>
                  <td>{new Date(supplier.createdAt).toLocaleDateString('ar-PS')}</td>
                  <td className={Number(supplier.debt) > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                    {Number(supplier.debt || 0).toLocaleString()} ₪
                  </td>
                  <td>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                          <Eye className="w-3.5 h-3.5 text-violet-400" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="glass-panel border-white/10 max-w-md w-[95vw]">
                        <DialogHeader>
                          <DialogTitle className="text-white text-right">ملف المورد</DialogTitle>
                        </DialogHeader>
                        <SupplierDetails supplier={supplier} />
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

function SupplierForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    notes: '',
    debt: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return alert("الرجاء إدخال اسم المورد!")

    setIsPending(true)
    try {
      const supplierData = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        notes: formData.notes,
        debt: Number(formData.debt) || 0,
        createdAt: new Date().toISOString()
      }

      const res = await fetch(`${BASE_URL}/suppliers?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(supplierData) })
      })

      if (!res.ok) throw new Error("فشل الحفظ")
      
      onSuccess()
    } catch (error) {
      console.error("خطأ:", error)
      alert("حدث خطأ أثناء حفظ المورد")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">اسم المندوب أو المورد <span className="text-violet-400">*</span></label>
          <input 
            required 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="glass-input w-full border-violet-500/20 focus:border-violet-500/50" 
            placeholder="الاسم الكامل..." 
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">الشركة أو المصنع</label>
          <input 
            type="text" 
            value={formData.company} 
            onChange={(e) => setFormData({...formData, company: e.target.value})} 
            className="glass-input w-full" 
            placeholder="مثال: مجوهرات تركيا" 
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">رقم الهاتف (واتساب / اتصال)</label>
          <input 
            type="tel" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="glass-input w-full" 
            placeholder="059... أو 0090..." 
            dir="ltr"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">رصيد افتتاحي (ديون سابقة للمورد علينا)</label>
          <input 
            type="number" 
            min="0" 
            value={formData.debt} 
            onChange={(e) => setFormData({...formData, debt: Number(e.target.value)})} 
            className="glass-input w-full font-bold text-red-400" 
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">ملاحظات والتزامات</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            className="glass-input w-full min-h-[80px] resize-none" 
            placeholder="شروط الدفع، أوقات التوريد المعتادة..." 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-end mt-6">
        <button 
          type="submit" 
          disabled={isPending} 
          className="glass-button !bg-violet-600 hover:!bg-violet-500 w-full sm:w-auto px-8"
        >
          {isPending ? 'جاري الحفظ...' : 'حفظ بيانات المورد'}
        </button>
      </div>
    </form>
  )
}

function SupplierDetails({ supplier }: { supplier: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 p-4 glass rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
          <Truck className="w-8 h-8 text-violet-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
          <p className="text-sm text-violet-400 mt-1">تاريخ الإضافة: {new Date(supplier.createdAt).toLocaleDateString('ar-PS')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-[10px] text-white/40">الشركة / المصنع</p>
            <p className="text-sm text-white/90">{supplier.company || 'غير محدد'}</p>
          </div>
        </div>

        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-[10px] text-white/40">رقم الهاتف</p>
            <p className="text-sm font-mono text-white/90" dir="ltr">{supplier.phone || 'غير محدد'}</p>
          </div>
        </div>
      </div>

      {supplier.notes && (
        <div className="glass p-4 rounded-lg">
          <p className="text-[10px] text-white/40 mb-1">ملاحظات وتفاصيل</p>
          <p className="text-sm text-white/80 leading-relaxed">{supplier.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
        <span className="text-white/60">إجمالي الديون (لنا للمورد)</span>
        <span className={`text-xl font-bold ${Number(supplier.debt) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {Number(supplier.debt || 0).toLocaleString()} ₪
        </span>
      </div>
    </div>
  )
}