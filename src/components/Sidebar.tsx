import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Home,
  Users, 
  GraduationCap, 
  Music, 
  Calendar, 
  ClipboardList,
  BarChart3,
  Settings,
  Search,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'מידע כללי', href: '/dashboard', icon: Home },
  { name: 'תלמידים', href: '/students', icon: Users },
  { name: 'מורים', href: '/teachers', icon: GraduationCap },
  { name: 'תזמורות', href: '/orchestras', icon: Music },
  { name: 'חזרות', href: '/rehearsals', icon: Calendar },
  { name: 'בגרות', href: '/bagrut', icon: ClipboardList },
  { name: 'דוחות', href: '/reports', icon: BarChart3 },
  { name: 'הגדרות', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isActive = (path: string) => location.pathname === path

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(false) // Close mobile menu when switching to desktop
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('mobile-sidebar')
        const hamburger = document.getElementById('hamburger-button')
        if (sidebar && !sidebar.contains(event.target as Node) && 
            hamburger && !hamburger.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      {isMobile && (
        <button
          id="hamburger-button"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 right-4 z-[1001] p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      )}

      {/* Backdrop Overlay - Mobile Only */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[999] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || isOpen) && (
        <div 
          id="mobile-sidebar"
          className={`fixed top-0 right-0 w-[280px] h-screen bg-white border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] rtl z-[1000] ${
            isMobile 
              ? `transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}` 
              : ''
          }`}
        >
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-reisinger-michal text-right rtl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-4 py-3 mx-3 rounded-lg text-sm font-medium transition-all duration-150 rtl font-reisinger-michal ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className="text-right">{item.name}</span>
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
          </div>
        </nav>
        </div>
      )}
    </>
  )
}