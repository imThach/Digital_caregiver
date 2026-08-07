import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'

export function Sidebar({ patientName = 'Robert Chen', isOpen = false, onClose }) {
  const location = useLocation()
  const currentPath = location.pathname

  const isNavActive = (path) => {
    if (path === '/prescriptions' && (currentPath === '/prescriptions' || currentPath === '/prescription-review')) {
      return true
    }
    return currentPath === path
  }

  const getLinkClasses = (path) => {
    if (isNavActive(path)) {
      return "flex items-center gap-3 rounded-l-xl border-r-4 border-primary bg-primary-container/10 px-md py-sm font-bold text-primary transition-colors"
    }
    return "flex items-center gap-3 rounded-xl px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-variant/50"
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-surface-container-low fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/30 px-md py-lg shadow-sm transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-xl flex items-center justify-between px-sm">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Cura AI Logo" className="h-10 w-auto" />
            <span className="text-[18px] font-bold tracking-tight text-primary">Digital caregiver</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-outline hover:bg-surface-variant/50 hover:text-primary lg:hidden cursor-pointer"
              aria-label="Close Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            className={`mb-6 flex items-center gap-3 rounded-xl px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-variant/50 ${currentPath === '/dashboard' ? 'bg-surface-variant/60 font-semibold' : ''}`}
            to="/dashboard"
            onClick={handleLinkClick}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-title-md text-[14px]">Back to Dashboard</span>
          </Link>
          <div className="px-md mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Patient: {patientName}
            </span>
          </div>
          <Link
            className={getLinkClasses('/elderly-overview')}
            to="/elderly-overview"
            onClick={handleLinkClick}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isNavActive('/elderly-overview') ? '"FILL" 1' : '"FILL" 0' }}
            >
              dashboard
            </span>
            <span className="font-title-md text-[16px]">Overview</span>
          </Link>
          <Link
            className={getLinkClasses('/prescriptions')}
            to="/prescriptions"
            onClick={handleLinkClick}
          >
            <span className="material-symbols-outlined">medical_services</span>
            <span className="font-title-md text-[16px]">Prescriptions</span>
          </Link>
          <Link
            className={getLinkClasses('/alerts-history')}
            to="/alerts-history"
            onClick={handleLinkClick}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="font-title-md text-[16px]">Alerts &amp; History</span>
          </Link>
          <Link
            className={getLinkClasses('/profile')}
            to="/profile"
            onClick={handleLinkClick}
          >
            <span className="material-symbols-outlined">family_restroom</span>
            <span className="font-title-md text-[16px]">Family Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
