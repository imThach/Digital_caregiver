import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/authProvider.jsx'
import Icon from '../common/Icon'
import SettingsModal, { applyTheme } from '../common/SettingsModal.jsx'

export function Header({
  title = 'Digital Caregiver',
  subtitle = 'Manage your elderly family members',
  onAddElderly,
  userInitials,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const userMenuRef = useRef(null)
  const { logout } = useAuth()

  useEffect(() => {
    applyTheme()

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#c2c6d6] bg-[#f8f9ff]/85 shadow-sm backdrop-blur-md">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex-1">
            <h1 className="m-0 text-2xl font-bold tracking-tight text-[#0058be] sm:text-3xl">{title}</h1>
            {subtitle && (
              <p className="m-0 mt-1 hidden text-sm text-[#424754] sm:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center sm:flex">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full text-[#424754] transition hover:bg-[#e5eeff] hover:text-[#0058be] dark:text-[#a3b1c6] dark:hover:bg-[#1a3250] dark:hover:text-white sm:h-10 sm:w-10 cursor-pointer"
                type="button"
                aria-label="Settings"
                title="Cài đặt giao diện & Ngôn ngữ"
              >
                <Icon name="settings" />
              </button>
            </div>
            {onAddElderly && (
              <button
                className="h-10 cursor-pointer rounded-full bg-[#0058be] px-4 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 sm:px-5 sm:text-base"
                type="button"
                onClick={onAddElderly}
              >
                Add Elderly
              </button>
            )}
            <div className="relative" ref={userMenuRef}>
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-[#c2c6d6] bg-[#d3e4fe] text-xs font-black text-[#0058be] transition hover:border-[#0058be] hover:bg-[#c2d9ff] focus:outline-none focus:ring-2 focus:ring-[#0058be] focus:ring-offset-2 dark:border-[#263c5a] dark:bg-[#1a3250] dark:text-white"
                type="button"
                aria-label="User menu"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
              >
                {userInitials || 'NA'}
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-lg border border-[#c2c6d6] bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f0] dark:hover:bg-red-950/40 cursor-pointer"
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <Icon name="log-out" className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal (Language & Theme) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}

export default Header
