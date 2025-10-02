import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../services/authContext.jsx'
import { useSidebar } from '../contexts/SidebarContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth()
  const { isDesktopOpen, isMobile } = useSidebar()

  // Check if user should see the sidebar (all users with roles)
  const shouldShowSidebar = !user ||
    user.role === 'admin' ||
    user.roles?.includes('admin') ||
    user.role === 'teacher' ||
    user.roles?.includes('teacher') ||
    user.role === 'conductor' ||
    user.roles?.includes('conductor') ||
    user.role === 'theory-teacher' ||
    user.roles?.includes('theory-teacher') ||
    user.role === 'theory_teacher' ||
    user.roles?.includes('theory_teacher') ||
    user.teaching?.studentIds?.length > 0 ||
    user.conducting?.orchestraIds?.length > 0

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar - Show for all users with roles */}
      {shouldShowSidebar && <Sidebar />}

      {/* Header */}
      <Header />

      {/* Main Content - Adjust margin based on sidebar presence and state */}
      <main
        className="mt-16 ml-0 p-0 bg-gray-50 min-h-[calc(100vh-64px)] rtl transition-all duration-300"
        style={{
          marginRight: shouldShowSidebar && !isMobile && isDesktopOpen ? '280px' : '0'
        }}
      >
        <div className="p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
}