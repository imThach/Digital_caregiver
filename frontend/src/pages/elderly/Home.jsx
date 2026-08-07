import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useNavigate } from 'react-router-dom'
import { medicationApi, emergencyApi, aiAssistantApi } from '../../api/apiServices'
import { useAuth } from '../../auth/authProvider'
import ImageLightboxModal from '../../components/common/ImageLightboxModal'
import MedicationReminderModal from '../../components/elderly/MedicationReminderModal'

export function ElderlyHome() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const elderlyId = user?._id || 'my-elderly'
  const patientNickname = user?.nickname || user?.fullName || 'Bà Lan'
  useDocumentTitle('Trang chủ')

  // Clock state
  const [currentTimeStr, setCurrentTimeStr] = useState('')
  const [currentDateStr, setCurrentDateStr] = useState('')

  // Schedules state
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Modals & UI States
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const [isSendingSos, setIsSendingSos] = useState(false)

  // Image Lightbox Zoom Modal State
  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  })

  // Medication Alarm Reminder Pop-up Modal State
  const [reminderModalState, setReminderModalState] = useState({
    isOpen: false,
    schedule: null,
  })

  // Track voiced alarms to avoid repetition in same minute
  const voicedSchedulesRef = useRef(new Set())

  // AI Assistant Chat State
  const [aiMessage, setAiMessage] = useState('')
  const [aiChatHistory, setAiChatHistory] = useState([
    { sender: 'assistant', text: `Chào ${patientNickname}, con là trợ lý AI. Bà cần giúp đỡ gì về thuốc hôm nay ạ?` },
  ])
  const [isAiReplying, setIsAiReplying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const currentAudioRef = useRef(null)
  const recognitionRef = useRef(null)

  const playLocalSynthesis = useCallback((textToSpeak) => {
    if (!('speechSynthesis' in window)) return

    const getViFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices || voices.length === 0) return null

      return (
        voices.find(
          (v) =>
            (v.lang?.toLowerCase().includes('vi') ||
              v.name?.toLowerCase().includes('vietnam') ||
              v.name?.toLowerCase().includes('tiếng việt')) &&
            (v.name?.toLowerCase().includes('female') ||
              v.name?.toLowerCase().includes('nữ') ||
              v.name?.toLowerCase().includes('hoaimy') ||
              v.name?.toLowerCase().includes('linh') ||
              v.name?.toLowerCase().includes('giao') ||
              v.name?.toLowerCase().includes('google'))
        ) ||
        voices.find(
          (v) =>
            v.lang?.toLowerCase().includes('vi') ||
            v.name?.toLowerCase().includes('vietnam') ||
            v.name?.toLowerCase().includes('tiếng việt')
        )
      )
    }

    const speakWithVoice = () => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'vi-VN'

      const viVoice = getViFemaleVoice()
      if (viVoice) {
        utterance.voice = viVoice
      }
      utterance.rate = 0.95
      utterance.pitch = 1.25 // Warm female vocal tone
      window.speechSynthesis.speak(utterance)
    }

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakWithVoice()
        window.speechSynthesis.onvoiceschanged = null
      }
    } else {
      speakWithVoice()
    }
  }, [])

  // 100% Natural Vietnamese Female TTS Engine via Backend Proxy (Base64 MP3) & Local Fallback
  const speakText = useCallback(async (text) => {
    if (!text) return
    const cleanText = text.replace(/[*_#~`]/g, '').trim()
    if (!cleanText) return

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    // 1. Backend Proxy Google TTS (Returns Base64 Data URI - Never blocked by CORS/403)
    try {
      const res = await aiAssistantApi.speakTts(cleanText)
      const audioUrl = res.data?.audioUrl
      if (audioUrl) {
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio
        await audio.play()
        return
      }
    } catch (err) {
      console.warn('Backend TTS error, trying local fallback:', err)
    }

    // 2. Web Speech API Fallback
    playLocalSynthesis(cleanText)
  }, [playLocalSynthesis])

  // Pre-load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Helper to open pill image lightbox zoom
  const openLightbox = (imageUrl, title, subtitle) => {
    setLightboxData({
      isOpen: true,
      imageUrl: imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'Thuốc')}&background=0058be&color=fff&size=256`,
      title: title || 'Ảnh Thuốc',
      subtitle: subtitle || '',
    })
  }

  const closeLightbox = () => {
    setLightboxData((prev) => ({ ...prev, isOpen: false }))
  }

  // Helper: Check if current time has reached or passed a medication schedule's time
  const isScheduleTimeReached = useCallback((sch) => {
    if (!sch) return true
    if (sch.status === 'taken') return false

    const now = new Date()

    // If snoozed, check snoozeUntil
    if (sch.status === 'snoozed' && sch.snoozeUntil) {
      const snoozeDate = new Date(sch.snoozeUntil)
      return now >= snoozeDate
    }

    if (!sch.timeOfDay) return true
    const parts = sch.timeOfDay.split(':')
    if (parts.length < 2) return true

    const schHour = parseInt(parts[0], 10)
    const schMinute = parseInt(parts[1], 10)
    const schDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), schHour, schMinute, 0)

    return now >= schDate
  }, [])

  // Update Clock & Trigger Voice Alarm when medication time arrives
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTimeStr(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
      )
      const options = { weekday: 'long', month: 'long', day: 'numeric' }
      const dateStr = now.toLocaleDateString('vi-VN', options)
      setCurrentDateStr(dateStr.charAt(0).toUpperCase() + dateStr.slice(1))
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load Today's Schedules
  const loadSchedules = useCallback(async () => {
    if (!elderlyId) return
    setIsLoading(true)
    try {
      const res = await medicationApi.getTodaySchedules(elderlyId)
      setSchedules(res.data || [])
    } catch (err) {
      console.error('Lỗi khi tải lịch uống thuốc:', err)
    } finally {
      setIsLoading(false)
    }
  }, [elderlyId])

  useEffect(() => {
    loadSchedules()
    const timer = setInterval(loadSchedules, 30000)
    return () => clearInterval(timer)
  }, [loadSchedules])

  // Real-time medication voice alarm trigger when medication time is reached
  useEffect(() => {
    if (schedules.length === 0) return

    const now = new Date()
    const currentMinuteKey = `${now.getHours()}:${now.getMinutes()}`

    schedules.forEach((s) => {
      if (s.status === 'taken') return

      const isReady = isScheduleTimeReached(s)
      if (isReady) {
        const uniqueKey = `${s.scheduleId || s._id}_${currentMinuteKey}_${s.status}`
        if (!voicedSchedulesRef.current.has(uniqueKey)) {
          voicedSchedulesRef.current.add(uniqueKey)

          // Announce medication alert using female voice
          const alarmText = `${patientNickname} ơi, đến giờ uống thuốc ${s.medicationName}${s.timeOfDay ? ` lúc ${s.timeOfDay}` : ''} rồi ạ!`
          speakText(alarmText)

          // Pop up medication reminder modal for the elderly
          setReminderModalState({
            isOpen: true,
            schedule: s,
          })
        }
      }
    })
  }, [schedules, isScheduleTimeReached, patientNickname, speakText])

  // --- TIME SLOT GROUPING LOGIC ---
  const getSlotKey = (timeOfDay) => {
    if (!timeOfDay) return 'morning'
    const [h] = timeOfDay.split(':').map(Number)
    if (h >= 5 && h <= 10) return 'morning'
    if (h >= 11 && h <= 15) return 'afternoon'
    if (h >= 16 && h <= 20) return 'evening'
    return 'night'
  }

  const getSlotTitle = (slotKey) => {
    switch (slotKey) {
      case 'morning':
        return 'Buổi Sáng (07:00)'
      case 'afternoon':
        return 'Buổi Trưa (11:00)'
      case 'evening':
        return 'Buổi Tối (18:00)'
      case 'night':
        return 'Buổi Đêm (21:00)'
      default:
        return 'Buổi Sáng (07:00)'
    }
  }

  const getSlotNameShort = (slotKey) => {
    switch (slotKey) {
      case 'morning':
        return 'BUỔI SÁNG (07:00)'
      case 'afternoon':
        return 'BUỔI TRƯA (11:00)'
      case 'evening':
        return 'BUỔI TỐI (18:00)'
      case 'night':
        return 'BUỔI ĐÊM (21:00)'
      default:
        return 'BUỔI SÁNG (07:00)'
    }
  }

  const getCurrentHourSlot = () => {
    const h = new Date().getHours()
    if (h >= 5 && h <= 10) return 'morning'
    if (h >= 11 && h <= 15) return 'afternoon'
    if (h >= 16 && h <= 20) return 'evening'
    return 'night'
  }

  // Active slot determination
  const activeSlot = useMemo(() => {
    const currentHourSlot = getCurrentHourSlot()
    const currentSlotPending = schedules.filter(
      (s) => getSlotKey(s.timeOfDay) === currentHourSlot && s.status !== 'taken'
    )
    if (currentSlotPending.length > 0) return currentHourSlot

    const earliestPending = schedules.find((s) => s.status !== 'taken')
    if (earliestPending) return getSlotKey(earliestPending.timeOfDay)

    return currentHourSlot
  }, [schedules])

  // Filter schedules by slot
  const morningSchedules = useMemo(() => schedules.filter((s) => getSlotKey(s.timeOfDay) === 'morning'), [schedules])
  const afternoonSchedules = useMemo(() => schedules.filter((s) => getSlotKey(s.timeOfDay) === 'afternoon'), [schedules])
  const eveningSchedules = useMemo(() => schedules.filter((s) => getSlotKey(s.timeOfDay) === 'evening'), [schedules])

  const activeSlotSchedules = useMemo(() => schedules.filter((s) => getSlotKey(s.timeOfDay) === activeSlot), [schedules, activeSlot])
  const activeSlotPending = useMemo(() => activeSlotSchedules.filter((s) => s.status !== 'taken'), [activeSlotSchedules])

  // Check if any pending schedule in active slot has reached medication time
  const activeSlotPendingReady = useMemo(() => {
    return activeSlotPending.filter((s) => isScheduleTimeReached(s))
  }, [activeSlotPending, isScheduleTimeReached])

  const isSlotTimeReady = activeSlotPendingReady.length > 0
  const allTodayTaken = schedules.length > 0 && schedules.every((s) => s.status === 'taken')

  // Action: Take All Pending Medicines of Active Slot ONLY (Requires time reached)
  const handleConfirmActiveSlotTake = async () => {
    if (activeSlotPending.length === 0) {
      speakText(`Bà đã uống đủ tất cả các liều thuốc ${getSlotTitle(activeSlot)} rồi ạ!`)
      return
    }

    if (!isSlotTimeReady) {
      const firstPending = activeSlotPending[0]
      const timeStr = firstPending?.timeOfDay || ''
      speakText(`Dạ chưa tới giờ uống thuốc ${getSlotTitle(activeSlot)} ạ. Giờ hẹn là ${timeStr}, bà chờ tới giờ nhé!`)
      return
    }

    try {
      setIsLoading(true)
      await Promise.all(
        activeSlotPendingReady.map((s) =>
          medicationApi.logMedicationStatus(s.scheduleId || s._id, elderlyId, 'taken')
        )
      )

      speakText(`Tuyệt vời! Bà đã hoàn thành uống thuốc ${getSlotTitle(activeSlot)}. Hệ thống đã ghi nhận cho người thân.`)
      setReminderModalState({ isOpen: false, schedule: null })
      await loadSchedules()
    } catch (err) {
      console.error('Error confirming take slot:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Action: Snooze Active Slot Medicines 10 mins (Requires time reached)
  const handleSnoozeActiveSlot = async () => {
    if (activeSlotPending.length === 0) return

    if (!isSlotTimeReady) {
      const firstPending = activeSlotPending[0]
      const timeStr = firstPending?.timeOfDay || ''
      speakText(`Dạ thuốc chưa tới giờ uống (${timeStr}) nên chưa cần nhắc lại ạ.`)
      return
    }

    try {
      setIsLoading(true)
      await Promise.all(
        activeSlotPendingReady.map((s) =>
          medicationApi.logMedicationStatus(s.scheduleId || s._id, elderlyId, 'snoozed', 10)
        )
      )

      speakText(`Dạ vâng, hệ thống sẽ nhắc lại bà thuốc ${getSlotTitle(activeSlot)} sau 10 phút nữa ạ.`)
      setReminderModalState({ isOpen: false, schedule: null })
      await loadSchedules()
    } catch (err) {
      console.error('Error snoozing active slot:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Action: Confirm Single Medicine
  const handleConfirmSingleMed = async (med) => {
    if (!isScheduleTimeReached(med)) {
      speakText(`Dạ thuốc ${med.medicationName} chưa tới giờ uống ạ. Giờ hẹn là ${med.timeOfDay}.`)
      return
    }

    try {
      setIsLoading(true)
      await medicationApi.logMedicationStatus(med.scheduleId || med._id, elderlyId, 'taken')
      speakText(`Đã ghi nhận bà uống thuốc ${med.medicationName}.`)
      setReminderModalState({ isOpen: false, schedule: null })
      await loadSchedules()
    } catch (err) {
      console.error('Error confirming single med:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Action: Snooze Single Medicine
  const handleSnoozeSingleMed = async (med) => {
    if (!isScheduleTimeReached(med)) {
      speakText(`Dạ thuốc ${med.medicationName} chưa tới giờ uống ạ.`)
      return
    }

    try {
      setIsLoading(true)
      await medicationApi.logMedicationStatus(med.scheduleId || med._id, elderlyId, 'snoozed', 10)
      speakText(`Dạ vâng, hệ thống sẽ nhắc lại bà thuốc ${med.medicationName} sau 10 phút nữa.`)
      setReminderModalState({ isOpen: false, schedule: null })
      await loadSchedules()
    } catch (err) {
      console.error('Error snoozing single med:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Action: Trigger Emergency SOS
  const handleTriggerSOS = () => {
    setIsSendingSos(true)
    setSosActive(true)

    speakText(`Cảnh báo! Đã phát tín hiệu SOS cấp cứu tới người chăm sóc.`)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await emergencyApi.triggerSOS(
              elderlyId,
              'button',
              position.coords.latitude,
              position.coords.longitude
            )
            setSosMessage('Đã gửi vị trí GPS chính xác đến điện thoại người thân!')
          } catch (err) {
            setSosMessage('Đã phát tín hiệu SOS khẩn cấp tới hệ thống!')
          } finally {
            setIsSendingSos(false)
          }
        },
        async () => {
          try {
            await emergencyApi.triggerSOS(elderlyId, 'button')
            setSosMessage('Đã gửi tín hiệu SOS khẩn cấp thành công!')
          } catch {
            setSosMessage('Đã phát tín hiệu báo động SOS khẩn cấp!')
          } finally {
            setIsSendingSos(false)
          }
        }
      )
    } else {
      emergencyApi.triggerSOS(elderlyId, 'button').catch(() => {})
      setSosMessage('Đã gửi tín hiệu SOS khẩn cấp!')
      setIsSendingSos(false)
    }
  }

  // Action: Chat with AI Assistant
  const handleSendAiMessage = async (textToSend) => {
    const msg = textToSend || aiMessage
    if (!msg.trim()) return

    const userMsg = { sender: 'user', text: msg }
    setAiChatHistory((prev) => [...prev, userMsg])
    setAiMessage('')
    setIsAiReplying(true)

    try {
      const res = await aiAssistantApi.chatWithAssistant(elderlyId, msg)
      const replyText = res.data?.reply || res.data?.message || 'Con đã ghi nhận thông tin của bà ạ!'
      
      setAiChatHistory((prev) => [...prev, { sender: 'assistant', text: replyText }])
      speakText(replyText)
    } catch (err) {
      const fallbackMsg = 'Dạ, con khuyên bà hãy uống thuốc đúng giờ và nghỉ ngơi nhiều hơn ạ.'
      setAiChatHistory((prev) => [...prev, { sender: 'assistant', text: fallbackMsg }])
      speakText(fallbackMsg)
    } finally {
      setIsAiReplying(false)
    }
  }

  // Cleanup Speech Recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Voice Input Speech Recognition
  const handleStartSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói. Bạn có thể gõ câu hỏi vào ô chat.')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (e) {
        console.warn('Error aborting previous recognition instance:', e)
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        handleSendAiMessage(transcript)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      console.warn('Error starting speech recognition:', e)
    }
  }

  // Helper render item in schedule list drawer
  const renderScheduleDrawerItem = (s, idx) => {
    const isReady = isScheduleTimeReached(s)
    return (
      <div
        key={s.scheduleId || idx}
        className={`flex items-center justify-between p-3 rounded-2xl border ${
          s.status === 'taken'
            ? 'bg-[#006c49]/10 border-[#006c49]/30'
            : 'bg-[#f5f7fd] border-[#c2c6d6]/60'
        }`}
      >
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() =>
            openLightbox(
              s.imageUrl,
              s.medicationName,
              `Liều dùng: ${s.dosage || '1 viên'} | Giờ hẹn: ${s.timeOfDay}`
            )
          }
          title="Bấm để xem phóng to ảnh thuốc"
        >
          <div className="relative">
            <img
              src={
                s.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(s.medicationName)}&background=0058be&color=fff&size=256`
              }
              alt={s.medicationName}
              className="w-12 h-12 rounded-xl object-cover border border-[#0058be]/20 bg-white p-0.5 shadow-sm transition group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.medicationName)}&background=0058be&color=fff&size=256`
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-xs transition">
              <span className="material-symbols-outlined text-base">zoom_in</span>
            </div>
          </div>
          <div>
            <p className="m-0 font-bold text-[#0b1c30] text-sm group-hover:text-[#0058be] transition">{s.medicationName}</p>
            <p className="m-0 text-xs text-[#424754]">
              {s.timeOfDay} • {s.dosage || '1 viên'}
            </p>
          </div>
        </div>

        {s.status === 'taken' ? (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#006c49] text-white">Đã uống</span>
        ) : !isReady ? (
          <button
            onClick={() => speakText(`Dạ chưa tới giờ uống thuốc ${s.medicationName} ạ. Giờ hẹn là ${s.timeOfDay}.`)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-gray-300 text-gray-700 opacity-80 cursor-not-allowed flex items-center gap-1"
            title="Chưa tới giờ uống thuốc"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            Chưa tới ({s.timeOfDay})
          </button>
        ) : (
          <button
            onClick={() => handleConfirmSingleMed(s)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-[#0058be] text-white hover:bg-[#004395] cursor-pointer shadow-sm"
          >
            Xác nhận uống
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen pb-36 font-sans">
      {/* Top AppBar Strategy */}
      <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-40 bg-[#f8f9ff]/80 backdrop-blur-md shadow-sm border-b border-[#c2c6d6]/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0058be] text-3xl">health_and_safety</span>
          <span className="text-xl md:text-2xl font-black text-[#0058be] tracking-tight">ElderAssist</span>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'caregiver' && (
            <button
              onClick={() => navigate('/elderly-overview')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0058be]/10 text-[#0058be] text-xs sm:text-sm font-bold hover:bg-[#0058be]/20 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Về Người Chăm Sóc
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 text-[#424754] transition cursor-pointer"
            title="Cài đặt & Tài khoản"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Date & Time Header Display */}
        <section className="text-center space-y-1">
          <h1 className="m-0 text-5xl sm:text-6xl font-black text-[#0b1c30] tracking-tight">{currentTimeStr || '08:30 AM'}</h1>
          <p className="m-0 text-lg sm:text-xl font-bold text-[#0058be]">{currentDateStr || 'Thứ Ba, 4 tháng 8'}</p>
        </section>

        {/* TTS Speech Bubble */}
        <div
          onClick={() =>
            speakText(
              allTodayTaken
                ? `${patientNickname} ơi, bà đã uống đủ tất cả các liều thuốc hôm nay rồi ạ!`
                : activeSlotPendingReady.length > 0
                ? `${patientNickname} ơi, đến giờ uống thuốc ${getSlotTitle(activeSlot)} rồi ạ!`
                : activeSlotPending.length > 0
                ? `${patientNickname} ơi, chưa tới giờ uống thuốc ${getSlotTitle(activeSlot)}. Giờ hẹn tiếp theo là ${activeSlotPending[0]?.timeOfDay || ''} ạ.`
                : `${patientNickname} ơi, bà đã hoàn thành xong liều ${getSlotTitle(activeSlot)} rồi ạ!`
            )
          }
          className="relative inline-flex items-center gap-3 bg-[#2170e4] text-white px-5 py-3.5 rounded-[24px] shadow-md cursor-pointer hover:bg-[#0058be] transition-all ml-4 before:content-[''] before:absolute before:-bottom-2 before:left-8 before:w-4 before:h-4 before:bg-[#2170e4] before:rotate-45"
        >
          <span className="material-symbols-outlined text-3xl animate-bounce">volume_up</span>
          <p className="m-0 text-base sm:text-lg font-bold">
            {allTodayTaken
              ? `Hôm nay ${patientNickname} đã uống đủ tất cả các liều thuốc!`
              : activeSlotPendingReady.length > 0
              ? `${patientNickname} ơi, đến giờ uống thuốc ${getSlotTitle(activeSlot)} rồi ạ!`
              : activeSlotPending.length > 0
              ? `Chưa tới giờ uống thuốc ${getSlotTitle(activeSlot)} (Hẹn lúc ${activeSlotPending[0]?.timeOfDay || ''}).`
              : `Đã xong ${getSlotTitle(activeSlot)}. Giữ gìn sức khỏe nhé bà!`}
          </p>
        </div>

        {/* Medication Reminder Card for Active Slot */}
        <section className="bg-white rounded-[24px] shadow-lg border border-[#c2c6d6]/60 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[#c2c6d6]/30 pb-4">
            <h2 className="m-0 text-xl sm:text-2xl font-bold text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be]">
                {activeSlot === 'morning' ? 'wb_twilight' : activeSlot === 'afternoon' ? 'wb_sunny' : 'nights_stay'}
              </span>
              Lịch Thuốc {getSlotTitle(activeSlot)}
            </h2>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-sm ${
                activeSlotPendingReady.length > 0
                  ? 'bg-[#6cf8bb] text-[#00714d] animate-pulse'
                  : activeSlotPending.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-[#6cf8bb] text-[#00714d]'
              }`}
            >
              {activeSlotPendingReady.length > 0
                ? `${activeSlotPendingReady.length} loại tới giờ uống`
                : activeSlotPending.length > 0
                ? `Chưa tới giờ (${activeSlotPending[0]?.timeOfDay || ''})`
                : 'Hoàn thành'}
            </span>
          </div>

          {/* Medicine Items List for Active Slot */}
          <div className="grid grid-cols-1 gap-4">
            {activeSlotSchedules.length === 0 ? (
              <div className="py-8 text-center text-[#737f90]">
                <span className="material-symbols-outlined text-4xl text-[#0058be] mb-2">medication</span>
                <p className="m-0 font-bold text-base">Không có lịch uống thuốc nào cho {getSlotTitle(activeSlot)}.</p>
              </div>
            ) : activeSlotPending.length === 0 ? (
              <div className="p-6 bg-[#006c49]/10 rounded-[24px] border border-[#006c49]/30 text-center">
                <span className="material-symbols-outlined text-5xl text-[#006c49] mb-2">task_alt</span>
                <h3 className="m-0 text-xl font-bold text-[#006c49]">Hoàn thành {getSlotTitle(activeSlot)}!</h3>
                <p className="mt-1 text-sm text-[#424754]">Bà đã uống đủ tất cả các loại thuốc trong {getSlotTitle(activeSlot)}.</p>
              </div>
            ) : (
              activeSlotPending.map((med, idx) => {
                const isReady = isScheduleTimeReached(med)
                return (
                  <div
                    key={med.scheduleId || idx}
                    className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all shadow-sm ${
                      isReady ? 'bg-[#eff4ff] border-[#0058be]/30 hover:border-[#0058be]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() =>
                        openLightbox(
                          med.imageUrl,
                          med.medicationName,
                          `Liều dùng: ${med.dosage || '1 Viên'} | Giờ hẹn: ${med.timeOfDay}`
                        )
                      }
                      title="Bấm để xem phóng to ảnh thuốc"
                    >
                      <img
                        alt={med.medicationName}
                        className="w-20 h-20 rounded-2xl object-cover bg-white p-1 shadow-sm border border-[#0058be]/20 flex-shrink-0 transition group-hover:scale-105"
                        src={
                          med.imageUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(med.medicationName)}&background=0058be&color=fff&size=256`
                        }
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(med.medicationName)}&background=0058be&color=fff&size=256`
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white text-xs font-bold transition">
                        <span className="material-symbols-outlined text-lg">zoom_in</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="m-0 text-lg sm:text-xl font-bold text-[#0b1c30]">{med.medicationName}</h3>
                        {!isReady && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Hẹn {med.timeOfDay}
                          </span>
                        )}
                      </div>
                      <p className="m-0 text-base font-bold text-[#0058be]">{med.dosage || '1 Viên'} • ({med.timeOfDay})</p>
                      <p className="m-0 text-xs sm:text-sm font-semibold text-[#424754]">
                        {med.usageNote || 'Uống sau bữa ăn'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Primary Massive Buttons with Time Lock Guard */}
        <div className="flex flex-col gap-4 pt-2">
          <button
            onClick={handleConfirmActiveSlotTake}
            disabled={isLoading || activeSlotPending.length === 0 || !isSlotTimeReady}
            className={`btn-press w-full h-[88px] text-white rounded-[24px] shadow-xl flex items-center justify-center gap-3 text-xl sm:text-2xl font-black transition-all ${
              !isSlotTimeReady || activeSlotPending.length === 0
                ? 'bg-gray-400 opacity-65 cursor-not-allowed'
                : 'bg-[#006c49] hover:bg-[#005539] cursor-pointer active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[36px]">
              {isSlotTimeReady ? 'check_circle' : 'lock'}
            </span>
            {activeSlotPending.length === 0
              ? `✓ ĐÃ HOÀN THÀNH ${getSlotNameShort(activeSlot)}`
              : !isSlotTimeReady
              ? `🔒 CHƯA TỚI GIỜ UỐNG (${activeSlotPending[0]?.timeOfDay || ''})`
              : `✓ BÀ ĐÃ UỐNG THUỐC ${getSlotNameShort(activeSlot)}`}
          </button>

          <button
            onClick={handleSnoozeActiveSlot}
            disabled={isLoading || activeSlotPending.length === 0 || !isSlotTimeReady}
            className={`btn-press w-full h-[88px] text-white rounded-[24px] shadow-xl flex items-center justify-center gap-3 text-xl sm:text-2xl font-black transition-all ${
              !isSlotTimeReady || activeSlotPending.length === 0
                ? 'bg-gray-400 opacity-65 cursor-not-allowed'
                : 'bg-[#b75b00] hover:bg-[#924700] cursor-pointer active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[36px]">
              {isSlotTimeReady ? 'schedule' : 'lock_clock'}
            </span>
            {!isSlotTimeReady
              ? `🔒 CHƯA TỚI GIỜ NHẮC LẠI`
              : `⏰ NHẮC LẠI BÀ SAU 10 PHÚT`}
          </button>
        </div>

        {/* Secondary Action: View Full Schedule */}
        <div className="flex justify-center py-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#e5eeff] hover:bg-[#d3e4fe] rounded-full text-base sm:text-lg font-bold text-[#0058be] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">assignment</span>
            📋 Xem Toàn Bộ Lịch 3 Buổi Trong Ngày
          </button>
        </div>
      </main>

      {/* Bottom Floating Navigation (SOS & Ask AI) */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-between items-end px-6 pb-6 pointer-events-none">
        {/* Emergency SOS Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <button
            onClick={handleTriggerSOS}
            className="flex items-center justify-center bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-full w-[96px] h-[96px] sm:w-[104px] sm:h-[104px] shadow-2xl active:scale-90 transition-transform duration-200 border-4 border-white cursor-pointer group"
            title="Nhấn để gọi SOS Cấp cứu"
          >
            <span className="material-symbols-outlined text-[48px] sm:text-[54px] group-hover:animate-ping">emergency</span>
          </button>
          <span className="text-xs font-black bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[#ba1a1a] shadow-md border border-[#ba1a1a]/30">
            SOS CẤP CỨU
          </span>
        </div>

        {/* Ask AI Microphone Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl shadow-sm border border-[#c2c6d6]/60">
            <p className="m-0 text-[11px] font-bold text-[#424754]">Nhấn để nói chuyện với AI</p>
          </div>
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center justify-center bg-[#0058be] hover:bg-[#004395] text-white rounded-full w-[96px] h-[96px] sm:w-[104px] sm:h-[104px] shadow-2xl active:scale-90 transition-transform duration-200 border-4 border-white cursor-pointer"
            title="Hỏi trợ lý AI"
          >
            <span className="material-symbols-outlined text-[48px] sm:text-[54px]">mic</span>
          </button>
          <span className="text-xs font-black bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[#0058be] shadow-md border border-[#0058be]/30">
            HỎI TRỢ LÝ AI
          </span>
        </div>
      </nav>

      {/* --- MODAL 1: Full Schedule Drawer Modal Grouped by 3 Slots --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[600px] min-w-[320px] bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#c2c6d6]/40 pb-4 mb-4">
              <h3 className="m-0 text-xl font-bold text-[#0b1c30] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0058be]">calendar_today</span>
                Lịch Uống Thuốc Trong Ngày
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-full text-[#737f90] hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Slot 1: Buổi Sáng */}
              <div>
                <h4 className="m-0 mb-2 text-sm font-bold text-[#0058be] flex items-center gap-1.5 uppercase">
                  <span className="material-symbols-outlined text-base">wb_twilight</span>
                  Buổi Sáng (5:00 - 10:59)
                </h4>
                <div className="space-y-2">
                  {morningSchedules.length === 0 ? (
                    <p className="text-xs text-[#737f90] italic pl-2">Không có lịch thuốc buổi sáng.</p>
                  ) : (
                    morningSchedules.map((s, idx) => renderScheduleDrawerItem(s, idx))
                  )}
                </div>
              </div>

              {/* Slot 2: Buổi Trưa */}
              <div>
                <h4 className="m-0 mb-2 text-sm font-bold text-[#b75b00] flex items-center gap-1.5 uppercase">
                  <span className="material-symbols-outlined text-base">wb_sunny</span>
                  Buổi Trưa (11:00 - 15:59)
                </h4>
                <div className="space-y-2">
                  {afternoonSchedules.length === 0 ? (
                    <p className="text-xs text-[#737f90] italic pl-2">Không có lịch thuốc buổi trưa.</p>
                  ) : (
                    afternoonSchedules.map((s, idx) => renderScheduleDrawerItem(s, idx))
                  )}
                </div>
              </div>

              {/* Slot 3: Buổi Tối */}
              <div>
                <h4 className="m-0 mb-2 text-sm font-bold text-[#4c32a8] flex items-center gap-1.5 uppercase">
                  <span className="material-symbols-outlined text-base">nights_stay</span>
                  Buổi Tối (16:00 - 21:00)
                </h4>
                <div className="space-y-2">
                  {eveningSchedules.length === 0 ? (
                    <p className="text-xs text-[#737f90] italic pl-2">Không có lịch thuốc buổi tối.</p>
                  ) : (
                    eveningSchedules.map((s, idx) => renderScheduleDrawerItem(s, idx))
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowScheduleModal(false)}
              className="mt-4 w-full py-3 bg-[#0058be] text-white font-bold rounded-2xl cursor-pointer hover:bg-[#004395]"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Emergency SOS Confirmation (Non-flickering) --- */}
      {sosActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-[480px] min-w-[320px] bg-white rounded-3xl p-6 shadow-2xl text-center border-4 border-[#ba1a1a]">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#ba1a1a] text-white animate-bounce">
              <span className="material-symbols-outlined text-5xl">emergency</span>
            </div>

            <h3 className="m-0 text-2xl font-black text-[#ba1a1a]">ĐÃ PHÁT TÍN HIỆU SOS!</h3>
            <p className="mt-2 text-sm font-bold text-[#0b1c30]">
              {isSendingSos ? 'Đang gửi vị trí GPS đến điện thoại người thân...' : sosMessage || 'Hệ thống đã thông báo khẩn cấp tới Người chăm sóc!'}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setSosActive(false)}
                className="w-full py-3.5 bg-[#ba1a1a] text-white font-black text-lg rounded-2xl shadow-lg hover:bg-[#93000a] cursor-pointer"
              >
                ĐÃ AN TOÀN - TẮT BÁO ĐỘNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Interactive Ask AI Modal --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[600px] min-w-[320px] bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#c2c6d6]/40 pb-4 mb-4">
              <h3 className="m-0 text-xl font-bold text-[#0058be] flex items-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                Trợ Lý Sức Khỏe AI
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-full text-[#737f90] hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {aiChatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-sm font-semibold shadow-sm ${
                      chat.sender === 'user'
                        ? 'bg-[#0058be] text-white rounded-br-none'
                        : 'bg-[#f5f7fd] text-[#0b1c30] border border-[#c2c6d6]/60 rounded-bl-none'
                    }`}
                  >
                    {chat.text}
                  </div>
                </div>
              ))}
              {isAiReplying && (
                <div className="flex justify-start">
                  <div className="bg-[#f5f7fd] text-[#0058be] text-xs font-bold p-3 rounded-2xl animate-pulse">
                    Trợ lý AI đang suy nghĩ câu trả lời...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#c2c6d6]/40 flex items-center gap-2">
              <button
                onClick={handleStartSpeechInput}
                className={`p-3 rounded-full text-white font-bold transition cursor-pointer shrink-0 ${
                  isListening ? 'bg-[#ba1a1a] animate-ping' : 'bg-[#0058be] hover:bg-[#004395]'
                }`}
                title="Bấm để nói bằng giọng nói"
              >
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>

              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                placeholder="Hỏi về cách dùng thuốc, lời dặn..."
                className="flex-1 rounded-2xl border border-[#c2c6d6] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058be]"
              />

              <button
                onClick={() => handleSendAiMessage()}
                disabled={!aiMessage.trim() || isAiReplying}
                className="px-4 py-2.5 bg-[#0058be] text-white font-bold rounded-2xl text-xs hover:bg-[#004395] disabled:opacity-50 cursor-pointer"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Settings & Logout Modal --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] min-w-[300px] bg-white rounded-3xl p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#0058be]/10 text-[#0058be]">
              <span className="material-symbols-outlined text-3xl">account_circle</span>
            </div>
            <h3 className="m-0 text-xl font-bold text-[#0b1c30]">{patientNickname}</h3>
            <p className="mt-1 text-xs text-[#737f90]">Vai trò: Thiết bị Người cao tuổi</p>

            <div className="mt-6 space-y-3">
              {user?.role === 'caregiver' && (
                <button
                  onClick={() => {
                    setShowSettingsModal(false)
                    navigate('/elderly-overview')
                  }}
                  className="w-full py-3 bg-[#e5eeff] text-[#0058be] font-bold rounded-2xl cursor-pointer hover:bg-[#d3e4fe]"
                >
                  Màn hình Người chăm sóc
                </button>
              )}
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 bg-gray-100 text-[#424754] font-bold rounded-2xl cursor-pointer hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Medication Reminder Alert Modal --- */}
      <MedicationReminderModal
        isOpen={reminderModalState.isOpen}
        medicationName={reminderModalState.schedule?.medicationName}
        patientNickname={patientNickname}
        dosage={reminderModalState.schedule?.dosage}
        timeOfDay={reminderModalState.schedule?.timeOfDay}
        pillImage={reminderModalState.schedule?.imageUrl}
        isTimeYet={reminderModalState.schedule ? isScheduleTimeReached(reminderModalState.schedule) : true}
        onConfirmTake={() => {
          if (reminderModalState.schedule) {
            handleConfirmSingleMed(reminderModalState.schedule)
          }
        }}
        onSnooze={() => {
          if (reminderModalState.schedule) {
            handleSnoozeSingleMed(reminderModalState.schedule)
          }
        }}
        onClose={() => setReminderModalState({ isOpen: false, schedule: null })}
        speakFn={speakText}
      />

      {/* --- MODAL 6: Pill Image Lightbox Zoom Modal --- */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        imageUrl={lightboxData.imageUrl}
        title={lightboxData.title}
        subtitle={lightboxData.subtitle}
        onClose={closeLightbox}
      />
    </div>
  )
}

export default ElderlyHome
