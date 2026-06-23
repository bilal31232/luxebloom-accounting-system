import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Users, Phone, MapPin } from 'lucide-react'
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

export default function Customers() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/customers?pageSize=300&key=${API_KEY}`)
      if (res.status !== 404) {
        const data = await res.json()
        setCustomers((data.documents || []).map((d: any) => parseFirestoreDoc(d)))
      }
    } catch (error) {
      console.error("خطأ في جلب العملاء:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredCustomers = customers
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalDebt = customers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-cyan-400">العملاء والزبائن</h1>
          <p className="text-white/50 text-sm mt-1">إدارة بيانات العملاء والذمم المالية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="glass-button flex items-center justify-center gap-2 w-full sm:w-auto !bg-cyan-500/20 !text-cyan-400 hover:!bg-cyan-500/30 !border-cyan-500/30">
              <Plus className="w-4 h-4" /> إضافة عميل جديد
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-xl w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-white text-right">تسجيل بيانات عميل</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSuccess={() => { setIsDialogOpen(false); fetchData(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass p-4 rounded-xl relative">
          <Search className="absolute right-7 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="البحث باسم العميل أو رقم الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pr-10" />
        </div>
        <div className="glass p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-l from-cyan-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">إجمالي ديون العملاء بالسوق</p>
            <p className="text-2xl font-bold text-cyan-400">{totalDebt.toLocaleString()} ₪</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="table-glass min-w-[800px]">
          <thead>
            <tr>
              <th>اسم العميل</th>
              <th>رقم الهاتف</th>
              <th>المدينة / العنوان</th>
              <th>تاريخ التسجيل</th>
              <th>الرصيد (دين عليه)</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-white/50">جاري تحميل العملاء...</td></tr>
            ) : filteredCustomers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-white/40">لا يوجد عملاء مسجلين</td></tr>
            ) : (
              filteredCustomers.map((customer: any) => (
                <tr key={customer.id}>
                  <td className="font-medium text-white">{customer.name}</td>
                  <td className="text-white/80 font-mono tracking-wider">{customer.phone || '-'}</td>
                  <td className="text-white/60">{customer.address || '-'}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString('ar-PS')}</td>
                  <td className={Number(customer.debt) > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                    {Number(customer.debt || 0).toLocaleString()} ₪
                  </td>
                  <td>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="glass-panel border-white/10 max-w-md w-[95vw]">
                        <DialogHeader>
                          <DialogTitle className="text-white text-right">ملف العميل</DialogTitle>
                        </DialogHeader>
                        <CustomerDetails customer={customer} />
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

function CustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    debt: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return alert("الرجاء إدخال اسم العميل!")

    setIsPending(true)
    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        debt: Number(formData.debt) || 0,
        createdAt: new Date().toISOString()
      }

      const res = await fetch(`${BASE_URL}/customers?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(customerData) })
      })

      if (!res.ok) throw new Error("فشل الحفظ")
      
      onSuccess()
    } catch (error) {
      console.error("خطأ:", error)
      alert("حدث خطأ أثناء حفظ العميل")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">اسم العميل <span className="text-cyan-400">*</span></label>
          <input 
            required 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="glass-input w-full border-cyan-500/20 focus:border-cyan-500/50" 
            placeholder="الاسم الكامل..." 
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">رقم الهاتف (واتساب)</label>
          <input 
            type="tel" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="glass-input w-full" 
            placeholder="059..." 
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">المدينة / العنوان</label>
          <input 
            type="text" 
            value={formData.address} 
            onChange={(e) => setFormData({...formData, address: e.target.value})} 
            className="glass-input w-full" 
            placeholder="مثال: الخليل - الحرس" 
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">رصيد افتتاحي (ديون سابقة إن وجدت)</label>
          <input 
            type="number" 
            min="0" 
            value={formData.debt} 
            onChange={(e) => setFormData({...formData, debt: Number(e.target.value)})} 
            className="glass-input w-full" 
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">ملاحظات عن العميل</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            className="glass-input w-full min-h-[80px] resize-none" 
            placeholder="تفضيلات العميل، قياسات الخواتم المعتادة..." 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-end mt-6">
        <button 
          type="submit" 
          disabled={isPending} 
          className="glass-button !bg-cyan-600 hover:!bg-cyan-500 w-full sm:w-auto px-8"
        >
          {isPending ? 'جاري الحفظ...' : 'حفظ بيانات العميل'}
        </button>
      </div>
    </form>
  )
}

function CustomerDetails({ customer }: { customer: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 p-4 glass rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
          <Users className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{customer.name}</h3>
          <p className="text-sm text-cyan-400 mt-1">تاريخ التسجيل: {new Date(customer.createdAt).toLocaleDateString('ar-PS')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-[10px] text-white/40">رقم الهاتف</p>
            <p className="text-sm font-mono text-white/90" dir="ltr">{customer.phone || 'غير محدد'}</p>
          </div>
        </div>

        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-[10px] text-white/40">العنوان</p>
            <p className="text-sm text-white/90">{customer.address || 'غير محدد'}</p>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="glass p-4 rounded-lg">
          <p className="text-[10px] text-white/40 mb-1">ملاحظات وتفضيلات</p>
          <p className="text-sm text-white/80 leading-relaxed">{customer.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
        <span className="text-white/60">إجمالي الديون المتراكمة (ذمم)</span>
        <span className={`text-xl font-bold ${Number(customer.debt) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {Number(customer.debt || 0).toLocaleString()} ₪
        </span>
      </div>
    </div>
  )
}