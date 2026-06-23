import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Settings, Database, Shield, Palette, Bell, Save, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // --- حالات (States) الإعدادات العامة ---
  const [storeName, setStoreName] = useState('لوكس بلوم')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [currency, setCurrency] = useState('ILS')
  const [dateFormat, setDateFormat] = useState('gregorian') // ميلادي افتراضي

  // --- حالات المظهر ---
  const [theme, setTheme] = useState('dark')

  // --- حالات الإشعارات ---
  const [notifications, setNotifications] = useState({
    lowStock: true,
    debts: true,
    dailyReport: false,
    recurring: true
  })

  // جلب الإعدادات المحفوظة من فايربيس أول ما تفتح الصفحة
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'system'))
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.general) {
            setStoreName(data.general.storeName || 'لوكس بلوم')
            setPhone(data.general.phone || '')
            setEmail(data.general.email || '')
            setAddress(data.general.address || '')
            setCurrency(data.general.currency || 'ILS')
            setDateFormat(data.general.dateFormat || 'gregorian')
          }
          if (data.appearance) {
            setTheme(data.appearance.theme || 'dark')
          }
          if (data.notifications) {
            setNotifications(data.notifications)
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
    loadSettings()
  }, [])

  // تطبيق السمة (Theme) على كامل الموقع فور تغييرها
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [theme])

  // حفظ الإعدادات في فايربيس
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        general: { storeName, phone, email, address, currency, dateFormat },
        appearance: { theme },
        notifications: notifications
      }, { merge: true }) // merge: true عشان ما يمسح بيانات ثانية لو موجودة
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("حدث خطأ أثناء الحفظ")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="text-white/50 text-sm mt-1">إعدادات النظام والتفضيلات</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="glass-button flex items-center gap-2">
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'جاري الحفظ...' : saved ? 'تم الحفظ بنجاح!' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 col-span-1 h-fit">
          <div className="space-y-1">
            {[
              { id: 'general', label: 'عام', icon: Settings },
              { id: 'appearance', label: 'المظهر', icon: Palette },
              { id: 'database', label: 'قاعدة البيانات', icon: Database },
              { id: 'security', label: 'الأمان', icon: Shield },
              { id: 'notifications', label: 'الإشعارات', icon: Bell },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)} 
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === item.id ? 'bg-gold-500/20 text-gold-400' : 'text-white/60 hover:bg-white/[0.04]'}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-6 col-span-1 md:col-span-3 min-h-[400px]">
          
          {/* 1. إعدادات عامة */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="section-title">إعدادات عامة</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">اسم المتجر</label>
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="glass-input w-full" placeholder="اسم متجرك..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">الهاتف</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="glass-input w-full" placeholder="رقم الهاتف..." />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">البريد الإلكتروني</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input w-full" placeholder="البريد الإلكتروني..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">العنوان</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="glass-input w-full" placeholder="عنوان المتجر..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">العملة الافتراضية</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="glass-input w-full">
                      <option value="ILS">شيكل (₪)</option>
                      <option value="USD">دولار أمريكي ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">تنسيق التاريخ</label>
                    <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="glass-input w-full">
                      <option value="gregorian">ميلادي</option>
                      <option value="hijri">هجري</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. المظهر */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="section-title">إعدادات المظهر</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-white/60 mb-3">السمة (فاتح / داكن)</label>
                  <div className="flex gap-4">
                    <div 
                      onClick={() => setTheme('dark')} 
                      className={`glass p-4 rounded-lg cursor-pointer text-center w-32 transition-all ${theme === 'dark' ? 'border-2 border-gold-500 bg-white/[0.05]' : 'border border-white/[0.06] hover:bg-white/[0.02]'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0a0e1a] mx-auto mb-2 border border-white/20" />
                      <p className="text-xs font-bold text-white/90">داكن</p>
                    </div>
                    <div 
                      onClick={() => setTheme('light')} 
                      className={`glass p-4 rounded-lg cursor-pointer text-center w-32 transition-all opacity-80 hover:opacity-100 ${theme === 'light' ? 'border-2 border-gold-500 bg-white/[0.05]' : 'border border-white/[0.06]'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white mx-auto mb-2 border border-gray-300" />
                      <p className="text-xs font-bold text-white/90">فاتح</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. قاعدة البيانات */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="section-title">حالة قاعدة البيانات</h3>
              <div className="space-y-4">
                <div className="glass p-5 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">الخوادم السحابية (Firebase)</p>
                      <p className="text-sm text-white/50 mt-1">قاعدة البيانات تعمل بأعلى كفاءة</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">متصل ومزامن</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass p-5 rounded-lg border border-gold-500/20 bg-gold-500/5">
                  <h4 className="text-gold-400 font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> 
                    الأمان والنسخ الاحتياطي
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    تم نقل نظامك بالكامل من التخزين المحلي القديم إلى خوادم جوجل السحابية (Firebase Firestore). 
                    هذا يعني أن بياناتك تُحفظ وتُزامن فوراً وبشكل آمن 100%. لم تعد بحاجة لعمل "نسخ احتياطي" يدوي، 
                    فبياناتك محمية من التلف أو الضياع حتى لو فقدت جهازك.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. الأمان */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="section-title">الأمان وتغيير كلمة المرور</h3>
              <div className="space-y-4 max-w-md">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                  <p className="text-xs text-blue-400">ملاحظة: هذه الواجهة جاهزة للاستخدام بمجرد تفعيل نظام تسجيل الدخول للموظفين مستقبلاً.</p>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">كلمة المرور الحالية</label>
                  <input type="password" placeholder="••••••••" className="glass-input w-full" disabled />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">كلمة المرور الجديدة</label>
                  <input type="password" placeholder="••••••••" className="glass-input w-full" disabled />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">تأكيد كلمة المرور</label>
                  <input type="password" placeholder="••••••••" className="glass-input w-full" disabled />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <input type="checkbox" className="w-4 h-4 accent-gold-500 rounded" disabled />
                  <span className="text-sm text-white/70">تفعيل تسجيل الدخول المزدوج (2FA)</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. الإشعارات */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="section-title">تفضيلات الإشعارات</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-bold text-white/90">تنبيه المخزون المنخفض</p>
                    <p className="text-xs text-white/50 mt-0.5">إشعار فوري عندما يقل أي منتج عن الحد الأدنى</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.lowStock} onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-bold text-white/90">تنبيه الذمم والديون</p>
                    <p className="text-xs text-white/50 mt-0.5">إشعار عندما تقترب فترة استحقاق الديون للعملاء أو الموردين</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.debts} onChange={(e) => setNotifications({...notifications, debts: e.target.checked})} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-bold text-white/90">تقرير يومي مسائي</p>
                    <p className="text-xs text-white/50 mt-0.5">ملخص يومي بالمبيعات والمصاريف والأرباح بنهاية كل يوم</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.dailyReport} onChange={(e) => setNotifications({...notifications, dailyReport: e.target.checked})} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-bold text-white/90">تنبيه المصاريف المتكررة</p>
                    <p className="text-xs text-white/50 mt-0.5">إشعار لتذكيرك قبل موعد دفع الإيجار والرواتب والمصاريف المتكررة</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.recurring} onChange={(e) => setNotifications({...notifications, recurring: e.target.checked})} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}