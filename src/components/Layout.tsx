import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="mr-0 md:mr-[280px] mt-16 ml-0 p-0 bg-gray-50 min-h-[calc(100vh-64px)] rtl">
        <div className="p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
}