import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign } from 'lucide-react'
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

export default function Expenses() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/expenses?pageSize=100&key=${API_KEY}`)
      if (res.status !== 404) {
        const data = await res.json()
        setExpenses((data.documents || []).map((d: any) => parseFirestoreDoc(d)))
      }
    } catch (error) {
      console.error("خطأ في جلب المصاريف:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredExpenses = expenses
    .filter(exp => exp.title?.toLowerCase().includes(search.toLowerCase()) || exp.category?.includes(search))
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  // حساب إجمالي المصاريف المعروضة
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-rose-400">المصاريف والتكاليف</h1>
          <p className="text-white/50 text-sm mt-1">سجل النفقات اليومية والشهرية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="glass-button flex items-center justify-center gap-2 w-full sm:w-auto !bg-rose-500/20 !text-rose-400 hover:!bg-rose-500/30 !border-rose-500/30">
              <Plus className="w-4 h-4" /> إضافة مصروف جديد
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-xl w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-white text-right">تسجيل مصروف جديد</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              onSuccess={() => { setIsDialogOpen(false); fetchData(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* شريط الإحصائيات السريعة والبحث */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass p-4 rounded-xl relative">
          <Search className="absolute right-7 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="البحث بوصف المصروف أو التصنيف..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pr-10" />
        </div>
        <div className="glass p-4 rounded-xl border border-rose-500/20 bg-gradient-to-l from-rose-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">إجمالي المصاريف</p>
            <p className="text-2xl font-bold text-rose-400">{totalExpenses.toLocaleString()} ₪</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="table-glass min-w-[700px]">
          <thead>
            <tr>
              <th>تاريخ الصرف</th>
              <th>وصف المصروف</th>
              <th>التصنيف</th>
              <th>ملاحظات</th>
              <th className="text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-white/50">جاري تحميل المصاريف...</td></tr>
            ) : filteredExpenses.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-white/40">لا توجد مصاريف مسجلة</td></tr>
            ) : (
              filteredExpenses.map((exp: any) => (
                <tr key={exp.id}>
                  <td>{new Date(exp.date || exp.createdAt).toLocaleDateString('ar-PS')}</td>
                  <td className="font-medium text-white">{exp.title}</td>
                  <td>
                    <span className="text-xs bg-white/5 text-white/70 px-2 py-1 rounded border border-white/10">
                      {exp.category || 'عام'}
                    </span>
                  </td>
                  <td className="text-white/60 text-sm max-w-[200px] truncate" title={exp.notes}>
                    {exp.notes || '-'}
                  </td>
                  <td className="text-left text-rose-400 font-bold">{Number(exp.amount || 0).toLocaleString()} ₪</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'فواتير (كهرباء، ماء، إنترنت)',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const categories = [
    'رواتب وأجور',
    'فواتير (كهرباء، ماء، إنترنت)',
    'إيجار المحل',
    'صيانة وتصليحات',
    'ضيافة ونثريات',
    'تسويق وإعلانات',
    'شحن وتوصيل',
    'مصاريف أخرى'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount) return alert("الرجاء إدخال وصف المصروف والمبلغ!")

    setIsPending(true)
    try {
      const expenseData = {
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      }

      const res = await fetch(`${BASE_URL}/expenses?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(expenseData) })
      })

      if (!res.ok) throw new Error("فشل الحفظ")
      
      onSuccess()
    } catch (error) {
      console.error("خطأ:", error)
      alert("حدث خطأ أثناء حفظ المصروف")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm text-white/60 mb-1">وصف المصروف <span className="text-rose-400">*</span></label>
          <input 
            required 
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            className="glass-input w-full border-rose-500/20 focus:border-rose-500/50" 
            placeholder="مثال: فاتورة كهرباء شهر 6" 
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">التصنيف</label>
          <select 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            className="glass-input w-full"
          >
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">التاريخ</label>
          <input 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
            className="glass-input w-full" 
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">المبلغ (شيكل) <span className="text-rose-400">*</span></label>
          <input 
            required 
            type="number" 
            min="0" 
            step="0.01"
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})} 
            className="glass-input w-full text-rose-400 font-bold border-rose-500/20 focus:border-rose-500/50" 
            placeholder="0.00" 
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">ملاحظات إضافية</label>
          <input 
            type="text" 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            className="glass-input w-full" 
            placeholder="ملاحظات..." 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-end gap-2 mt-6">
        <button 
          type="submit" 
          disabled={isPending} 
          className="glass-button !bg-rose-600 hover:!bg-rose-500 w-full sm:w-auto px-8"
        >
          {isPending ? 'جاري الحفظ...' : 'حفظ المصروف'}
        </button>
      </div>
    </form>
  )
}