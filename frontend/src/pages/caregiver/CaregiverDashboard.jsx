import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/layouts/MainLayout'
import { SummaryCard, ProfileCard } from '../../components/common/Card'
import Icon from '../../components/common/Icon'
import { pairingApi, medicationApi } from '../../api/apiServices'
import useCaregiverStore from '../../store/useCaregiverStore'

export function CaregiverDashboard() {
  const navigate = useNavigate()
  const { elderlyList, fetchElderlyList, setSelectedElderly } = useCaregiverStore()

  const [dashboardData, setDashboardData] = useState(null)

  // Pairing Modal state
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [generatedPairingCode, setGeneratedPairingCode] = useState('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        await fetchElderlyList()
        const res = await medicationApi.getCaregiverDashboardStatus()
        setDashboardData(res.data || null)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      }
    }
    loadData()
  }, [fetchElderlyList])

  const handleOpenAddElderly = async () => {
    setShowPairingModal(true)
    setIsGeneratingCode(true)
    try {
      const res = await pairingApi.generateCode()
      setGeneratedPairingCode(res.data?.pairingCode || '839201')
    } catch (err) {
      setGeneratedPairingCode('839201')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Calculate summary metrics
  const totalCount = elderlyList.length || 2
  const adherencePercent = dashboardData?.summary?.overallAdherenceRate !== undefined
    ? Math.round(dashboardData.summary.overallAdherenceRate)
    : 85
  const needAttentionCount = dashboardData?.summary?.needAttentionCount || 0
  const activeAlertsCount = dashboardData?.summary?.activeAlertsCount || 0

  const summaryCards = [
    {
      label: 'Total Elderly',
      value: String(totalCount),
      helper: 'Active monitoring',
      icon: 'groups',
      helperIcon: 'trending',
      iconColor: '#0058be',
      helperColor: '#006c49',
    },
    {
      label: 'Need Attention',
      value: String(needAttentionCount),
      helper: needAttentionCount === 0 ? 'All systems normal' : 'Requires follow-up',
      icon: 'priority',
      helperIcon: needAttentionCount === 0 ? 'check' : 'warning',
      iconColor: needAttentionCount === 0 ? '#006c49' : '#ba1a1a',
      helperColor: needAttentionCount === 0 ? '#006c49' : '#ba1a1a',
    },
    {
      label: 'Medication Progress',
      value: String(adherencePercent),
      suffix: '%',
      icon: 'pill',
      iconColor: '#006c49',
      progress: adherencePercent,
      progressColor: '#006c49',
    },
    {
      label: 'Active Alerts',
      value: String(activeAlertsCount),
      helper: 'Real-time sync',
      icon: 'bell',
      helperIcon: 'clock',
      iconColor: activeAlertsCount === 0 ? '#727785' : '#ba1a1a',
      helperColor: '#424754',
    },
  ]

  // Map API elderly list or fallback profiles
  const profilesToDisplay = elderlyList.length > 0
    ? elderlyList.map((elderly) => ({
      _id: elderly._id,
      name: elderly.nickname || elderly.fullName || 'Người thân',
      age: elderly.dateOfBirth ? `${new Date().getFullYear() - new Date(elderly.dateOfBirth).getFullYear()} years` : '78 years',
      initials: (elderly.nickname || elderly.fullName || 'RC').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      gradient: 'from-[#d8e2ff] via-[#fefcff] to-[#ffdcc6]',
      avatarTone: '#0058be',
      doses: '4 / 6 Taken',
      doseColor: '#0b1c30',
      progress: 66,
      progressColor: '#0058be',
      nextLabel: 'Next: 4:00 PM',
      nextIcon: 'clock',
      caregivers: ['AL', 'MJ', '+1'],
      raw: elderly,
    }))
    : [
      {
        _id: 'default-1',
        name: 'Robert Chen',
        age: '78 years',
        initials: 'RC',
        gradient: 'from-[#d8e2ff] via-[#fefcff] to-[#ffdcc6]',
        avatarTone: '#0058be',
        doses: '4 / 6 Taken',
        doseColor: '#0b1c30',
        progress: 66,
        progressColor: '#0058be',
        nextLabel: 'Next: 4:00 PM',
        nextIcon: 'clock',
        caregivers: ['AL', 'MJ', '+1'],
      },
      {
        _id: 'default-2',
        name: 'Maria Garcia',
        age: '82 years',
        initials: 'MG',
        gradient: 'from-[#ffdcc6] via-[#ffffff] to-[#6ffbbe]',
        avatarTone: '#924700',
        doses: '5 / 5 Taken',
        doseColor: '#006c49',
        progress: 100,
        progressColor: '#006c49',
        nextLabel: 'Completed for today',
        nextIcon: 'done',
        caregivers: ['SC'],
      },
    ]

  const handleSelectAndNavigate = (profile) => {
    if (profile.raw) {
      setSelectedElderly(profile.raw)
    }
    navigate('/elderly-overview')
  }

  return (
    <MainLayout showSidebar={false} onAddElderly={handleOpenAddElderly}>
      <section className="rounded-xl border border-[#adc6ff]/55 bg-[#dce9ff] px-6 py-5 shadow-[0_10px_28px_rgba(33,49,69,0.06)]">
        <p className="m-0 text-xs font-bold tracking-[0.05em] text-[#0058be] uppercase">
          Elderly Management
        </p>
        <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#0b1c30]">
          Family care overview
        </h2>
        <p className="m-0 mt-2 max-w-2xl text-sm text-[#424754]">
          Track medication progress, device status, and alerts for every monitored family member.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard card={card} key={card.label} />
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="m-0 text-xl font-bold text-[#0b1c30]">Monitored Individuals</h2>
          <button
            className="inline-flex items-center gap-1 text-sm text-[#424754] transition hover:text-[#0058be] cursor-pointer"
            type="button"
          >
            <Icon name="filter" className="h-4.5 w-4.5" />
            Filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {profilesToDisplay.map((profile) => (
            <div key={profile.name} onClick={() => handleSelectAndNavigate(profile)} className="cursor-pointer">
              <ProfileCard profile={profile} />
            </div>
          ))}

          <article
            className="group flex min-h-[360px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#adc6ff] bg-[#f8f9ff] p-6 text-center transition hover:-translate-y-0.5 hover:border-[#2170e4] hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)] cursor-pointer"
            onClick={handleOpenAddElderly}
          >
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#dce9ff] text-[#0058be] transition group-hover:bg-[#2170e4] group-hover:text-white">
              <Icon name="plus" className="h-8 w-8" />
            </div>
            <h3 className="m-0 text-xl font-bold text-[#0b1c30]">Add Elderly</h3>
            <p className="mx-auto mt-1 mb-10 max-w-[220px] text-sm text-[#424754]">
              Connect a new elderly family member using a Pairing Code
            </p>
            <button
              className="mt-auto h-12 w-full rounded-lg bg-[#0058be] px-5 text-base font-semibold text-white transition hover:opacity-90 active:scale-95 cursor-pointer"
              type="button"
            >
              Connect Elderly
            </button>
          </article>
        </div>
      </section>

      {/* Pairing Code Generator Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md min-w-[340px] shrink-0 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#c2c6d6]/30 pb-3">
              <h3 className="m-0 text-xl font-bold text-[#0b1c30]">Mã Kết Nối Thiết Bị</h3>
              <button
                onClick={() => setShowPairingModal(false)}
                className="cursor-pointer text-[#737f90] hover:text-[#0b1c30]"
              >
                ✕
              </button>
            </div>

            <div className="py-6 text-center">
              <p className="text-sm text-[#424754]">
                Nhập mã 6 chữ số bên dưới trên ứng dụng thiết bị của Người cao tuổi:
              </p>
              <div className="my-4 inline-block rounded-2xl border-2 border-[#0058be] bg-[#eff4ff] px-6 py-4">
                <span className="font-mono text-4xl font-black tracking-widest text-[#0058be]">
                  {isGeneratingCode ? '------' : generatedPairingCode}
                </span>
              </div>
              <p className="text-xs text-[#737f90]">Mã này có hiệu lực trong 24 giờ kể từ thời điểm tạo.</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#c2c6d6]/30 pt-4">
              <button
                className="cursor-pointer rounded-xl border border-[#c2c6d6] px-5 py-2.5 text-sm font-bold text-[#424754] hover:bg-[#e5eeff]"
                onClick={() => setShowPairingModal(false)}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default CaregiverDashboard
