import { Sidebar } from './Sidebar'
import { Outlet } from 'react-router'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      {/* التعديل هنا: md:mr-64 تجعل الإزاحة للكمبيوتر فقط، و pt-16 أو pt-4 لترتيب المحتوى */}
      <main className="md:mr-64 min-h-screen pt-16 md:pt-0 transition-all duration-300">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}