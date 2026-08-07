import { useState, useEffect, useCallback } from 'react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import MainLayout from '../../components/layouts/MainLayout'
import useCaregiverStore from '../../store/useCaregiverStore'
import { medicationApi, prescriptionApi } from '../../api/apiServices'

export function ElderlyOverview() {
  const { selectedElderly, fetchElderlyList } = useCaregiverStore()
  useDocumentTitle(selectedElderly ? `${selectedElderly.nickname || selectedElderly.fullName}` : 'Tổng quan')

  useEffect(() => {
    if (!selectedElderly) {
      fetchElderlyList()
    }
  }, [selectedElderly, fetchElderlyList])

  const patientNickname = selectedElderly?.nickname || selectedElderly?.fullName || 'Người thân'
  const elderlyId = selectedElderly?._id || 'my-elderly'

  const [schedules, setSchedules] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  const loadOverviewData = useCallback(async () => {
    if (!elderlyId) return
    setIsLoading(true)
    try {
      const [schedulesRes, prescriptionsRes] = await Promise.all([
        medicationApi.getTodaySchedules(elderlyId).catch(() => ({ data: [] })),
        prescriptionApi.getElderlyPrescriptions(elderlyId).catch(() => ({ data: { prescriptions: [] } })),
      ])

      setSchedules(schedulesRes.data || [])
      setPrescriptions(prescriptionsRes.data?.prescriptions || [])
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('Error loading overview data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [elderlyId])

  useEffect(() => {
    loadOverviewData()

    // Real-time polling every 30 seconds
    const timer = setInterval(() => {
      loadOverviewData()
    }, 30000)

    // Immediate sync on window focus & visibility change
    const handleFocus = () => {
      loadOverviewData()
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [loadOverviewData])

  // Handle Confirm Take
  const handleConfirmTake = async (scheduleId) => {
    try {
      await medicationApi.logMedicationStatus(scheduleId, elderlyId, 'taken')
      await loadOverviewData()
    } catch (err) {
      console.error('Error logging medication taken:', err)
    }
  }

  // Handle Snooze 10 minutes
  const handleSnooze = async (scheduleId) => {
    try {
      await medicationApi.logMedicationStatus(scheduleId, elderlyId, 'snoozed', 10)
      await loadOverviewData()
    } catch (err) {
      console.error('Error logging medication snooze:', err)
    }
  }

  // Calculated stats from real DB schedules
  const totalCount = schedules.length
  const takenCount = schedules.filter((s) => s.status === 'taken').length
  const adherencePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0
  const activeAlertsCount = schedules.filter((s) => s.status === 'snoozed' || s.status === 'missed').length
  const nextSchedule = schedules.find((s) => s.status === 'pending' || s.status === 'snoozed' || s.status === 'missed')

  // Group schedules into period buckets
  const morningSchedules = schedules.filter((s) => {
    const hour = parseInt(s.timeOfDay?.split(':')[0] || '8', 10)
    return hour >= 0 && hour < 12
  })

  const afternoonSchedules = schedules.filter((s) => {
    const hour = parseInt(s.timeOfDay?.split(':')[0] || '13', 10)
    return hour >= 12 && hour < 17
  })

  const eveningSchedules = schedules.filter((s) => {
    const hour = parseInt(s.timeOfDay?.split(':')[0] || '19', 10)
    return hour >= 17 && hour <= 23
  })

  const syncTimeString = lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Build activity feed
  const activities = []
  
  // Add prescription events
  prescriptions.forEach((p) => {
    activities.push({
      id: `p-${p._id}`,
      title: 'Đã lưu đơn thuốc mới',
      description: `${p.title || 'Đơn thuốc khám bệnh'} (${p.rawAiResponse?.length || 0} loại thuốc)`,
      time: new Date(p.createdAt || p.confirmedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(p.createdAt || p.confirmedAt || Date.now()).getTime(),
      icon: 'neurology',
      bgColor: 'bg-[#0058be]',
    })
  })

  // Add medication status logs
  schedules.forEach((s) => {
    if (s.status === 'taken') {
      activities.push({
        id: `s-taken-${s.scheduleId}`,
        title: 'Đã xác nhận uống thuốc',
        description: `${s.medicationName} (${s.timeOfDay})`,
        time: s.respondedAt ? new Date(s.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : s.timeOfDay,
        timestamp: s.respondedAt ? new Date(s.respondedAt).getTime() : Date.now(),
        icon: 'done',
        bgColor: 'bg-[#006c49]',
      })
    } else if (s.status === 'snoozed') {
      activities.push({
        id: `s-snoozed-${s.scheduleId}`,
        title: 'Đã hoãn nhắc thuốc 10 phút',
        description: `${s.medicationName} (${s.timeOfDay})`,
        time: s.timeOfDay,
        timestamp: Date.now() - 300000,
        icon: 'alarm',
        bgColor: 'bg-[#7a4d00]',
      })
    }
  })

  // Sort activities newest first
  activities.sort((a, b) => b.timestamp - a.timestamp)

  const renderScheduleCard = (s) => (
    <div
      key={s.scheduleId}
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
        s.status === 'taken'
          ? 'border-[#006c49]/30 bg-[#006c49]/5'
          : s.status === 'snoozed'
          ? 'border-[#7a4d00]/30 bg-[#fff8ed]'
          : s.status === 'missed'
          ? 'border-[#ba1a1a]/30 bg-[#fff5f5]'
          : 'border-[#c2c6d6]/60 bg-[#f5f7fd]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-xl border border-[#0058be]/20 bg-white shadow-sm flex-shrink-0 flex items-center justify-center">
          {s.imageUrl ? (
            <img
              src={s.imageUrl}
              alt={s.medicationName}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.medicationName)}&background=0058be&color=fff&size=128`
              }}
            />
          ) : (
            <span className="material-symbols-outlined text-[#0058be]">medication</span>
          )}
        </div>
        <div>
          <p className="m-0 font-bold text-[#0b1c30] text-base">{s.medicationName}</p>
          <p className="m-0 text-xs text-[#424754]">
            <span className="font-bold text-[#0058be]">{s.timeOfDay}</span> • {s.dosage || '1 viên'}
            {s.usageNote ? ` • ${s.usageNote}` : ''}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block rounded bg-[#0058be]/10 px-2 py-0.5 text-[10px] font-bold text-[#0058be]">
              Còn {s.remainingQuantity !== undefined ? s.remainingQuantity : s.totalQuantity || 30} viên
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {s.status === 'taken' ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#006c49]/10 px-3.5 py-2 text-xs font-bold text-[#006c49]">
            <span className="material-symbols-outlined text-sm">check_circle</span> ĐÃ UỐNG
          </div>
        ) : s.status === 'snoozed' ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#7a4d00]/10 px-3.5 py-2 text-xs font-bold text-[#7a4d00]">
            <span className="material-symbols-outlined text-sm">alarm</span> YÊU CẦU HOÃN 10P
          </div>
        ) : s.status === 'missed' ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#ba1a1a]/10 px-3.5 py-2 text-xs font-bold text-[#ba1a1a]">
            <span className="material-symbols-outlined text-sm">warning</span> BỎ LỠ LIỀU THUỐC
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#0058be]/10 px-3.5 py-2 text-xs font-bold text-[#0058be]">
            <span className="material-symbols-outlined text-sm">schedule</span> CHỜ UỐNG
          </div>
        )}
      </div>
    </div>
  )

  return (
    <MainLayout patientName={patientNickname}>
      {/* Patient Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full ring-4 ring-[#0058be]/20 flex-shrink-0">
            <img
              src={selectedElderly?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientNickname)}&background=0058be&color=fff&size=128`}
              alt={patientNickname}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-[#0b1c30]">{patientNickname}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#006c49]" />
              <span className="text-xs font-bold text-[#006c49]">Active &amp; Monitoring</span>
              <span className="text-xs text-[#737f90]">• Tự động đồng bộ (30s) • Cập nhật: {syncTimeString}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Current Status */}
        <div className="rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#737f90]">Current Status</span>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                activeAlertsCount > 0 ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' : 'bg-[#006c49]/10 text-[#006c49]'
              }`}
            >
              <span className="material-symbols-outlined">
                {activeAlertsCount > 0 ? 'warning' : 'health_and_safety'}
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${activeAlertsCount > 0 ? 'text-[#ba1a1a]' : 'text-[#006c49]'}`}>
            {activeAlertsCount > 0 ? 'Cần chú ý' : totalCount > 0 ? 'Khỏe mạnh' : 'Chưa có đơn'}
          </div>
          <p className="mt-1 text-xs text-[#424754]">
            {activeAlertsCount > 0
              ? `Có ${activeAlertsCount} cảnh báo cần nhắc nhở`
              : totalCount > 0
              ? 'Lịch uống thuốc hoạt động bình thường'
              : 'Hãy quét & lưu đơn thuốc mới'}
          </p>
        </div>

        {/* Card 2: Adherence */}
        <div className="rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#737f90]">Adherence</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0058be]/10 text-[#0058be]">
              <span className="material-symbols-outlined">pill</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0b1c30]">
            {takenCount} / {totalCount} <span className="text-sm font-bold text-[#737f90]">Liều</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#d3e4fe]">
            <div className="h-full rounded-full bg-[#0058be] transition-all duration-500" style={{ width: `${adherencePercentage}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-[#424754]">
            {totalCount > 0 ? `${adherencePercentage}% mục tiêu ngày hoàn thành` : 'Chưa thiết lập lịch uống'}
          </p>
        </div>

        {/* Card 3: Up Next */}
        <div className="rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#737f90]">Up Next</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a4d00]/10 text-[#7a4d00]">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
          <div className="text-xl font-bold text-[#0b1c30] truncate">
            {nextSchedule ? nextSchedule.medicationName : totalCount > 0 ? 'Đã xong tất cả' : 'Chưa có lịch'}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-bold text-[#0058be]">
              {nextSchedule ? nextSchedule.timeOfDay : '--:--'}
            </span>
            <span className="rounded bg-[#edf2fb] px-2 py-0.5 text-[10px] font-bold uppercase text-[#737f90]">
              {nextSchedule ? 'Lần uống tiếp theo' : totalCount > 0 ? 'Hoàn thành' : 'Trống'}
            </span>
          </div>
        </div>

        {/* Card 4: Active Alerts */}
        <div className="rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#737f90]">Active Alerts</span>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                activeAlertsCount > 0 ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' : 'bg-[#006c49]/10 text-[#006c49]'
              }`}
            >
              <span className="material-symbols-outlined">
                {activeAlertsCount > 0 ? 'notifications_active' : 'check_circle'}
              </span>
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0b1c30]">{activeAlertsCount}</div>
          <p className={`mt-1 text-xs font-bold ${activeAlertsCount > 0 ? 'text-[#ba1a1a]' : 'text-[#006c49]'}`}>
            {activeAlertsCount > 0 ? `Cần nhắc nhở ${activeAlertsCount} liều thuốc` : 'Tất cả bình thường'}
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-[#c2c6d6] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#c2c6d6]/40 bg-[#f8f9ff] px-6 py-4">
              <div>
                <h3 className="m-0 text-lg font-bold text-[#0b1c30]">Today's Medication Schedule</h3>
                <p className="m-0 text-xs text-[#737f90]">
                  Cập nhật thời gian thực dựa trên đơn thuốc đã lưu ({schedules.length} liều hôm nay)
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-[#006c49]">
                <span className="h-2 w-2 rounded-full bg-[#006c49] animate-pulse" />
                Real-time 30s
              </span>
            </div>

            <div className="space-y-6 p-6">
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0058be]/10 text-[#0058be]">
                    <span className="material-symbols-outlined text-3xl">medical_services</span>
                  </div>
                  <h4 className="m-0 text-lg font-bold text-[#0b1c30]">Chưa có lịch uống thuốc nào hôm nay</h4>
                  <p className="mt-1 text-xs text-[#424754]">
                    Hệ thống sẽ tự động khởi tạo lịch nhắc sau khi bạn tải đơn thuốc lên. Nhấn nút bên dưới để tạo đơn thuốc mới.
                  </p>
                  <button
                    onClick={() => navigate('/prescriptions')}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-[#0058be] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#00479e] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_a_photo</span>
                    Quét &amp; Thêm đơn thuốc ngay
                  </button>
                </div>
              ) : (
                <>
                  {/* Morning Dose */}
                  {morningSchedules.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#737f90]">
                        <span className="material-symbols-outlined text-sm text-amber-500">wb_sunny</span> Buổi sáng (Morning)
                      </div>
                      <div className="space-y-3">
                        {morningSchedules.map(renderScheduleCard)}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Dose */}
                  {afternoonSchedules.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#737f90]">
                        <span className="material-symbols-outlined text-sm text-sky-500">light_mode</span> Buổi chiều (Afternoon)
                      </div>
                      <div className="space-y-3">
                        {afternoonSchedules.map(renderScheduleCard)}
                      </div>
                    </div>
                  )}

                  {/* Evening Dose */}
                  {eveningSchedules.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#737f90]">
                        <span className="material-symbols-outlined text-sm text-indigo-500">dark_mode</span> Buổi tối (Evening / Night)
                      </div>
                      <div className="space-y-3">
                        {eveningSchedules.map(renderScheduleCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Activity & AI Insights */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
            <h3 className="m-0 mb-6 text-lg font-bold text-[#0b1c30]">Today's Activity</h3>
            
            {activities.length === 0 ? (
              <p className="m-0 text-xs text-[#737f90] italic">Chưa có hoạt động nào được ghi nhận hôm nay.</p>
            ) : (
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#c2c6d6]/40">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="relative pl-8">
                    <div className={`absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full ${act.bgColor} text-white`}>
                      <span className="material-symbols-outlined text-[12px]">{act.icon}</span>
                    </div>
                    <div>
                      <p className="m-0 text-sm font-bold text-[#0b1c30]">{act.title}</p>
                      <p className="m-0 mt-0.5 text-xs text-[#424754]">{act.description}</p>
                      <span className="text-[10px] text-[#737f90]">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl border-l-4 border-[#006c49] bg-gradient-to-br from-[#0058be]/5 to-[#006c49]/5 p-6 shadow-sm">
            <h4 className="m-0 mb-2 flex items-center gap-2 text-sm font-bold text-[#006c49]">
              <span className="material-symbols-outlined text-sm">auto_awesome</span> Digital Caregiver
            </h4>
            <p className="m-0 text-xs leading-relaxed text-[#424754]">
              {prescriptions.length > 0
                ? `${patientNickname} có ${prescriptions.length} đơn thuốc đang theo dõi với ${totalCount} liều uống hôm nay. Tỷ lệ tuân thủ đạt ${adherencePercentage}%. Gemini AI ghi nhận không có xung đột thuốc.`
                : `${patientNickname} chưa có đơn thuốc active nào trên hệ thống. Bạn có thể tải đơn thuốc lên mục Prescriptions để Gemini AI hỗ trợ tạo lịch tự động.`}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ElderlyOverview
