import React from 'react'
import Sidebar from './sidebar'
import Header from './Header'
import CaregiverSosAlertModal from '../common/CaregiverSosAlertModal'

export function MainLayout({
  children,
  showSidebar = true,
  patientName = 'Robert Chen',
  headerTitle,
  headerSubtitle,
  onAddElderly,
  userInitials,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)
  
  return (
    <div className="flex min-h-svh flex-col bg-[#e5eeff] text-[#0b1c30]">
      <CaregiverSosAlertModal />

      {showSidebar && (
        <Sidebar
          patientName={patientName}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`flex min-h-svh flex-col transition-all duration-300 ${
          showSidebar ? 'ml-0 w-full lg:ml-64 lg:w-[calc(100%-16rem)]' : 'w-full'
        }`}
      >
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          onAddElderly={onAddElderly}
          userInitials={userInitials}
          onToggleSidebar={showSidebar ? () => setIsMobileSidebarOpen((prev) => !prev) : undefined}
        />

        <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-8 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-[#c2c6d6] bg-[#f8f9ff] px-6 py-6 text-center text-sm text-[#424754]">
          &copy; 2026 CareConnect Healthcare Solutions. Built for reliable family monitoring.
        </footer>
      </div>
    </div>
  )
}

export default MainLayout
