import { Bell, Calendar, Settings, Music, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { icon: Bell, label: 'התראות', action: () => console.log('Notifications') },
    { icon: Calendar, label: 'לוח שנה', action: () => console.log('Calendar') },
    { icon: Settings, label: 'הגדרות', action: () => console.log('Settings') },
  ]

  return (
    <header className="fixed top-0 right-0 left-0 md:right-[280px] h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 pr-16 md:pr-6 z-[999]" style={{ direction: 'rtl' }}>
      {/* Right side (RTL) - Brand/Logo */}
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Left side (RTL) - User Controls */}
      <div className="flex items-center gap-4" style={{ direction: 'ltr' }}>
        {/* Desktop - Individual Icons */}
        {!isMobile && (
          <>
            {/* Notification Icon */}
            <button className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 ease-in-out cursor-pointer">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>

            {/* Calendar Icon */}
            <button className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 ease-in-out cursor-pointer">
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>

            {/* Settings Icon */}
            <button className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 ease-in-out cursor-pointer">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}

        {/* Mobile - Dropdown Menu */}
        {isMobile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 ease-in-out cursor-pointer"
            >
              {isDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1000]">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        item.action()
                        setIsDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center justify-between transition-colors duration-150"
                      style={{ direction: 'rtl' }}
                    >
                      <span className="text-sm font-medium text-gray-700 font-reisinger-michal">
                        {item.label}
                      </span>
                      <Icon className="w-4 h-4 text-gray-500" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer">
          <span className="text-sm font-semibold text-white font-reisinger-michal">מ</span>
        </div>
      </div>
    </header>
  )
}