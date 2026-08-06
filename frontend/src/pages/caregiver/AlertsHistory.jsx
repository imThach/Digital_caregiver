import React, { useState, useEffect, useCallback } from 'react'
import MainLayout from '../../components/layouts/MainLayout'
import useCaregiverStore from '../../store/useCaregiverStore'
import { emergencyApi, medicationApi, prescriptionApi } from '../../api/apiServices'

export function AlertsHistory() {
  const { selectedElderly } = useCaregiverStore()
  const patientNickname = selectedElderly?.nickname || selectedElderly?.fullName || 'Người thân'
  const elderlyId = selectedElderly?._id || 'my-elderly'

  const [alerts, setAlerts] = useState([])
  const [schedules, setSchedules] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Pagination states
  const [sosPage, setSosPage] = useState(1)
  const [sosLimit] = useState(5)
  const [sosPagination, setSosPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  })

  const [timelinePage, setTimelinePage] = useState(1)
  const [timelineLimit] = useState(6)

  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [emergencyRes, schedulesRes, prescriptionsRes] = await Promise.all([
        emergencyApi.getHistory({ page: sosPage, limit: sosLimit }).catch(() => ({ data: [] })),
        medicationApi.getTodaySchedules(elderlyId).catch(() => ({ data: [] })),
        prescriptionApi.getElderlyPrescriptions(elderlyId).catch(() => ({ data: { prescriptions: [] } })),
      ])

      const fetchedAlerts = emergencyRes.data || []
      setAlerts(fetchedAlerts)

      if (emergencyRes.pagination) {
        setSosPagination(emergencyRes.pagination)
      } else {
        setSosPagination({
          total: fetchedAlerts.length,
          page: sosPage,
          limit: sosLimit,
          totalPages: Math.ceil(fetchedAlerts.length / sosLimit) || 1,
        })
      }

      setSchedules(schedulesRes.data || [])
      setPrescriptions(prescriptionsRes.data?.prescriptions || [])
    } catch (err) {
      console.error('Error fetching alerts history data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [elderlyId, sosPage, sosLimit])

  useEffect(() => {
    loadAllData()

    // 30s Real-time polling
    const timer = setInterval(loadAllData, 30000)

    const handleFocus = () => loadAllData()
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [loadAllData])

  const handleAcknowledge = async (id, status) => {
    try {
      await emergencyApi.acknowledgeEmergency(id, status)
      setAlerts((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      )
      setStatusMsg(`Đã cập nhật trạng thái sự kiện SOS: ${status === 'acknowledged' ? 'Đã phản hồi' : 'Đã giải quyết'}!`)
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err) {
      console.error('Error acknowledging emergency:', err)
    }
  }

  // Calculate Metrics
  const activeEmergencyAlerts = alerts.filter((a) => a.status === 'triggered' || a.status === 'pending')
  const missedOrSnoozedMedications = schedules.filter((s) => s.status === 'missed' || s.status === 'snoozed')
  const totalActiveUrgentAlerts = activeEmergencyAlerts.length + missedOrSnoozedMedications.length

  const todayMedicationRemindersCount = schedules.length

  // Build unified Activity Timeline
  const activityTimeline = []

  // Add Emergency SOS Events
  alerts.forEach((evt) => {
    activityTimeline.push({
      id: `sos-${evt._id}`,
      type: 'emergency',
      title: `Cảnh báo SOS Cấp cứu (${evt.triggeredBy === 'button' ? 'Nút bấm khẩn cấp' : 'Hệ thống'})`,
      description: `Người phát: ${evt.elderlyId?.nickname || evt.elderlyId?.fullName || patientNickname}. Trạng thái: ${
        evt.status === 'resolved' ? 'Đã giải quyết' : evt.status === 'acknowledged' ? 'Đã phản hồi' : 'Chưa xử lý'
      }`,
      timestamp: new Date(evt.createdAt || Date.now()).getTime(),
      timeString: new Date(evt.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateString: new Date(evt.createdAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'numeric' }),
      icon: 'emergency',
      bgColor: 'bg-[#ba1a1a]',
      location: evt.location,
    })
  })

  // Add Prescription Created Events
  prescriptions.forEach((p) => {
    activityTimeline.push({
      id: `p-${p._id}`,
      type: 'prescription',
      title: 'Đã tạo & lưu đơn thuốc mới',
      description: `${p.title || 'Đơn thuốc khám bệnh'} (${p.rawAiResponse?.length || 0} loại thuốc)`,
      timestamp: new Date(p.createdAt || p.confirmedAt || Date.now()).getTime(),
      timeString: new Date(p.createdAt || p.confirmedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateString: new Date(p.createdAt || p.confirmedAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'numeric' }),
      icon: 'neurology',
      bgColor: 'bg-[#0058be]',
    })
  })

  // Add Medication Logs
  schedules.forEach((s) => {
    if (s.status === 'taken') {
      activityTimeline.push({
        id: `med-taken-${s.scheduleId}`,
        type: 'medication',
        title: 'Đã xác nhận uống thuốc',
        description: `${patientNickname} đã uống ${s.medicationName} (${s.timeOfDay} • ${s.dosage || '1 viên'})`,
        timestamp: s.respondedAt ? new Date(s.respondedAt).getTime() : Date.now(),
        timeString: s.respondedAt ? new Date(s.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : s.timeOfDay,
        dateString: 'Hôm nay',
        icon: 'done',
        bgColor: 'bg-[#006c49]',
      })
    } else if (s.status === 'snoozed') {
      activityTimeline.push({
        id: `med-snooze-${s.scheduleId}`,
        type: 'medication',
        title: 'Yêu cầu hoãn nhắc thuốc 10 phút',
        description: `${patientNickname} yêu cầu nhắc lại ${s.medicationName} (${s.timeOfDay})`,
        timestamp: Date.now() - 300000,
        timeString: s.timeOfDay,
        dateString: 'Hôm nay',
        icon: 'alarm',
        bgColor: 'bg-[#7a4d00]',
      })
    } else if (s.status === 'missed') {
      activityTimeline.push({
        id: `med-missed-${s.scheduleId}`,
        type: 'medication',
        title: 'Bỏ lỡ giờ uống thuốc',
        description: `${s.medicationName} chưa được uống theo lịch ${s.timeOfDay}`,
        timestamp: Date.now() - 1800000,
        timeString: s.timeOfDay,
        dateString: 'Hôm nay',
        icon: 'warning',
        bgColor: 'bg-[#ba1a1a]',
      })
    }
  })

  // Sort Timeline descending
  activityTimeline.sort((a, b) => b.timestamp - a.timestamp)

  // Timeline Pagination calculations
  const totalTimelineItems = activityTimeline.length
  const totalTimelinePages = Math.ceil(totalTimelineItems / timelineLimit) || 1
  const currentTimelineItems = activityTimeline.slice(
    (timelinePage - 1) * timelineLimit,
    timelinePage * timelineLimit
  )

  return (
    <MainLayout patientName={patientNickname}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Alerts &amp; History</h2>
          <p className="mt-1 text-body-lg text-on-surface-variant">
            Theo dõi các tín hiệu khẩn cấp SOS và xem lại lịch sử hoạt động thời gian thực của người cao tuổi.
          </p>
        </div>
        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-[#c2c6d6] bg-[#f8f9ff] px-4 py-2 text-xs font-bold text-[#0058be] hover:bg-[#e5eeff] cursor-pointer disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>sync</span>
          {isLoading ? 'Đang tải...' : 'Làm mới ngay'}
        </button>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {statusMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
            <span className="text-xs font-bold uppercase text-[#737f90]">Real-Time</span>
          </div>
          <h3 className="text-4xl font-bold leading-none text-[#ba1a1a]">{totalActiveUrgentAlerts}</h3>
          <p className="mt-2 text-sm font-semibold text-[#424754]">Active Urgent Alerts</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="material-symbols-outlined text-[#0058be]">medication</span>
            <span className="text-xs font-bold uppercase text-[#737f90]">Hôm nay</span>
          </div>
          <h3 className="text-4xl font-bold leading-none text-[#0058be]">{todayMedicationRemindersCount}</h3>
          <p className="mt-2 text-sm font-semibold text-[#424754]">Medication Reminders</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="material-symbols-outlined text-[#006c49]">bolt</span>
            <span className="text-xs font-bold uppercase text-[#737f90]">Tổng số</span>
          </div>
          <h3 className="text-4xl font-bold leading-none text-[#006c49]">{activityTimeline.length}</h3>
          <p className="mt-2 text-sm font-semibold text-[#424754]">Activities Logged</p>
        </div>
      </div>

      {/* Emergency Alerts & Activity Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Urgent SOS Notifications */}
        <div className="space-y-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="m-0 text-xl font-bold text-[#0b1c30] mb-4">Urgent SOS Notifications</h3>

            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-[#c2c6d6]/60 bg-white p-6 text-center shadow-sm">
                <span className="material-symbols-outlined text-4xl text-[#006c49] mb-2">verified_user</span>
                <h4 className="m-0 text-base font-bold text-[#0b1c30]">Không có cảnh báo khẩn cấp nào</h4>
                <p className="mt-1 text-xs text-[#737f90]">Tất cả hệ thống bình thường. Chưa có tín hiệu SOS khẩn cấp.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((evt) => (
                  <div
                    key={evt._id}
                    className={`rounded-2xl border-l-4 border border-[#c2c6d6] bg-white p-4 shadow-sm ${
                      evt.status === 'resolved'
                        ? 'border-l-[#006c49]'
                        : evt.status === 'acknowledged'
                        ? 'border-l-[#7a4d00]'
                        : 'border-l-[#ba1a1a]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          evt.status === 'resolved'
                            ? 'bg-[#006c49]/10 text-[#006c49]'
                            : evt.status === 'acknowledged'
                            ? 'bg-[#7a4d00]/10 text-[#7a4d00]'
                            : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
                        }`}
                      >
                        <span className="material-symbols-outlined">
                          {evt.status === 'resolved' ? 'check_circle' : 'emergency'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`m-0 text-base font-bold ${
                              evt.status === 'resolved'
                                ? 'text-[#006c49]'
                                : evt.status === 'acknowledged'
                                ? 'text-[#7a4d00]'
                                : 'text-[#ba1a1a]'
                            }`}
                          >
                            Emergency SOS ({evt.triggeredBy === 'button' ? 'Nút bấm' : 'Tự động'})
                          </h4>
                          <span className="text-[11px] text-[#737f90]">
                            {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="m-0 mt-1 text-xs text-[#424754]">
                          Người dùng: <strong className="text-[#0b1c30]">{evt.elderlyId?.nickname || evt.elderlyId?.fullName || patientNickname}</strong>.
                          Tín hiệu SOS đã được gửi khẩn cấp qua email.
                        </p>

                        {evt.location?.latitude && (
                          <div className="mt-2">
                            <a
                              href={`https://maps.google.com/?q=${evt.location.latitude},${evt.location.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0058be] hover:underline"
                            >
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              Xem vị trí GPS trên Google Maps
                            </a>
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          {evt.status !== 'acknowledged' && evt.status !== 'resolved' && (
                            <button
                              onClick={() => handleAcknowledge(evt._id, 'acknowledged')}
                              className="rounded-lg bg-[#ba1a1a] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#961212] cursor-pointer"
                            >
                              Xác nhận Phản hồi
                            </button>
                          )}
                          {evt.status !== 'resolved' && (
                            <button
                              onClick={() => handleAcknowledge(evt._id, 'resolved')}
                              className="rounded-lg border border-[#c2c6d6] px-3 py-1.5 text-xs font-bold text-[#424754] hover:bg-[#e5eeff] cursor-pointer"
                            >
                              Đánh dấu Đã xử lý
                            </button>
                          )}
                          {evt.status === 'resolved' && (
                            <span className="text-xs font-bold text-[#006c49]">✓ Sự kiện đã hoàn tất xử lý</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SOS Pagination Controls */}
          {sosPagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[#c2c6d6]/40 pt-3">
              <span className="text-xs font-semibold text-[#737f90]">
                Trang {sosPage} / {sosPagination.totalPages} (Tổng {sosPagination.total} cảnh báo)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSosPage((p) => Math.max(1, p - 1))}
                  disabled={sosPage <= 1 || isLoading}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#c2c6d6] bg-white text-[#0b1c30] hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  ◀ Trước
                </button>
                {Array.from({ length: sosPagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setSosPage(pageNum)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg border transition ${
                      pageNum === sosPage
                        ? 'bg-[#0058be] text-white border-[#0058be]'
                        : 'bg-white text-[#0b1c30] border-[#c2c6d6] hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setSosPage((p) => Math.min(sosPagination.totalPages, p + 1))}
                  disabled={sosPage >= sosPagination.totalPages || isLoading}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#c2c6d6] bg-white text-[#0b1c30] hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  Sau ▶
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-4 lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="m-0 text-xl font-bold text-[#0b1c30] mb-4">Activity Timeline</h3>
            <div className="rounded-2xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
              {activityTimeline.length === 0 ? (
                <p className="text-center text-xs text-[#737f90] py-4 italic">Chưa có nhật ký hoạt động nào.</p>
              ) : (
                <div className="space-y-6">
                  {currentTimelineItems.map((act) => (
                    <div key={act.id} className="flex items-start gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${act.bgColor} text-white font-bold text-xs shrink-0 shadow-sm`}>
                        <span className="material-symbols-outlined text-sm">{act.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="m-0 text-sm font-bold text-[#0b1c30]">{act.title}</h4>
                          <span className="text-[10px] text-[#737f90] font-semibold">{act.timeString} • {act.dateString}</span>
                        </div>
                        <p className="m-0 mt-0.5 text-xs text-[#424754]">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Pagination Controls */}
          {totalTimelinePages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[#c2c6d6]/40 pt-3">
              <span className="text-xs font-semibold text-[#737f90]">
                Hiển thị {Math.min((timelinePage - 1) * timelineLimit + 1, totalTimelineItems)} - {Math.min(timelinePage * timelineLimit, totalTimelineItems)} trong {totalTimelineItems} hoạt động
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                  disabled={timelinePage <= 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#c2c6d6] bg-white text-[#0b1c30] hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  ◀ Trước
                </button>
                {Array.from({ length: totalTimelinePages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setTimelinePage(pageNum)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg border transition ${
                      pageNum === timelinePage
                        ? 'bg-[#0058be] text-white border-[#0058be]'
                        : 'bg-white text-[#0b1c30] border-[#c2c6d6] hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setTimelinePage((p) => Math.min(totalTimelinePages, p + 1))}
                  disabled={timelinePage >= totalTimelinePages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#c2c6d6] bg-white text-[#0b1c30] hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  Sau ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default AlertsHistory