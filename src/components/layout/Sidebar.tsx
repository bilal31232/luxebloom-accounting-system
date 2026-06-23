import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Users,
  Building2,
  Calculator,
  BarChart3,
  Settings,
  TrendingDown,
  Sparkles,
  Menu, // أيقونة القائمة
  X // أيقونة الإغلاق
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/' },
  { icon: Package, label: 'المخزون', path: '/inventory' },
  { icon: ShoppingCart, label: 'المبيعات', path: '/sales' },
  { icon: ShoppingBag, label: 'المشتريات', path: '/purchases' },
  { icon: Receipt, label: 'المصاريف', path: '/expenses' },
  { icon: Users, label: 'العملاء', path: '/customers' },
  { icon: Building2, label: 'الموردين', path: '/suppliers' },
  { icon: Calculator, label: 'المحاسبة', path: '/accounting' },
  { icon: BarChart3, label: 'التقارير', path: '/reports' },
  { icon: Settings, label: 'الإعدادات', path: '/settings' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  // حالة التحكم بظهور القائمة على الموبايل
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* زر فتح القائمة (يظهر فقط على الموبايل في أعلى اليمين) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 right-4 z-40 p-2.5 rounded-xl glass-button border-gold-500/30 text-gold-400 shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* خلفية معتمة عند فتح القائمة على الموبايل (اضغط عليها للإغلاق) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-[#121a16]/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* القائمة الجانبية (مخفية يميناً على الموبايل، وتظهر عند فتحها، وثابتة على الكمبيوتر) */}
      <aside
        className={`glass-sidebar w-64 h-screen fixed right-0 top-0 z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                <Sparkles className="w-5 h-5 text-slate-900" />
              </div>
              <div className="absolute -inset-1 bg-gold-500/20 rounded-xl blur-md -z-10" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">فضة وستانليس</h1>
              <p className="text-[10px] text-white/40">نظام إدارة متكامل</p>
            </div>
          </div>
          
          {/* زر إغلاق القائمة الجانبية للموبايل */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setIsOpen(false) // إغلاق القائمة تلقائياً بعد اختيار صفحة على الموبايل
                }}
                className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="glass p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gold-400" />
              <span className="text-xs text-white/60">الرصيد اليومي</span>
            </div>
            <p className="text-lg font-bold text-gold-400 mt-1">12,450 ر.س</p>
          </div>
        </div>
      </aside>
    </>
  )
}