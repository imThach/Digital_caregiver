import React, { useState, useEffect, useRef, useCallback } from 'react'
import { socket } from '../../utils/socket'
import { emergencyApi } from '../../api/apiServices'
import { useAuth } from '../../auth/authProvider'

export function CaregiverSosAlertModal() {
  const { user } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const [activeSosEvent, setActiveSosEvent] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const sirenRef = useRef(null)

  // Web Audio API Siren Sound Synthesizer
  const startSiren = useCallback(() => {
    if (sirenRef.current) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, ctx.currentTime)

      let highPitch = true
      const interval = setInterval(() => {
        if (ctx.state === 'closed') {
          clearInterval(interval)
          return
        }
        try {
          osc.frequency.setValueAtTime(highPitch ? 660 : 880, ctx.currentTime)
          highPitch = !highPitch
        } catch {
          // ignore closed context errors
        }
      }, 350)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()

      sirenRef.current = { ctx, osc, interval }
    } catch (e) {
      console.warn('Could not play siren audio context:', e)
    }
  }, [])

  const stopSiren = useCallback(() => {
    if (sirenRef.current) {
      try {
        clearInterval(sirenRef.current.interval)
        sirenRef.current.osc.stop()
        sirenRef.current.ctx.close()
      } catch (e) {
        console.warn('Error stopping siren audio context:', e)
      }
      sirenRef.current = null
    }
  }, [])

  const checkActiveSosHistory = useCallback(async () => {
    if (!isCaregiver) return
    try {
      const res = await emergencyApi.getHistory()
      const list = res.data || []
      // Find latest unacknowledged / unresolved SOS event
      const activeEvent = list.find((e) => e.status === 'active')

      if (activeEvent) {
        setActiveSosEvent(activeEvent)
        startSiren()
      } else {
        setActiveSosEvent(null)
        stopSiren()
      }
    } catch (err) {
      console.error('Error fetching emergency SOS status:', err)
    }
  }, [isCaregiver, startSiren, stopSiren])

  useEffect(() => {
    if (!isCaregiver) return

    checkActiveSosHistory()

    // 5-second polling for immediate alert check
    const pollInterval = setInterval(checkActiveSosHistory, 5000)

    // Socket.io Real-time Event Listeners
    const handleIncomingSos = (data) => {
      console.log('🚨 REAL-TIME SOS SOCKET RECEIVED IN CAREGIVER MODAL:', data)
      if (data) {
        setActiveSosEvent(data)
        startSiren()
      } else {
        checkActiveSosHistory()
      }
    }

    const handleSosAcknowledged = (data) => {
      console.log('⚡ SOS ACKNOWLEDGED EVENT RECEIVED:', data)
      checkActiveSosHistory()
    }

    socket.on('receive_sos', handleIncomingSos)
    socket.on('emergency_sos_alert', handleIncomingSos)
    socket.on('sos_acknowledged', handleSosAcknowledged)

    return () => {
      clearInterval(pollInterval)
      socket.off('receive_sos', handleIncomingSos)
      socket.off('emergency_sos_alert', handleIncomingSos)
      socket.off('sos_acknowledged', handleSosAcknowledged)
      stopSiren()
    }
  }, [isCaregiver, checkActiveSosHistory, startSiren, stopSiren])

  const handleAction = async (status) => {
    if (!activeSosEvent || !activeSosEvent._id) {
      setActiveSosEvent(null)
      stopSiren()
      return
    }

    setIsProcessing(true)
    try {
      await emergencyApi.acknowledgeEmergency(activeSosEvent._id, status)
      setActiveSosEvent(null)
      stopSiren()
      await checkActiveSosHistory()
    } catch (err) {
      console.error('Failed to acknowledge emergency SOS:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isCaregiver || !activeSosEvent) return null

  const elderlyName = activeSosEvent.elderlyId?.nickname || activeSosEvent.elderlyId?.fullName || 'Người thân của bạn'
  const mapsLink = activeSosEvent.mapsLink || (activeSosEvent.latitude ? `https://www.google.com/maps?q=${activeSosEvent.latitude},${activeSosEvent.longitude}` : null)
  const timeString = activeSosEvent.createdAt ? new Date(activeSosEvent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[560px] min-w-[320px] rounded-3xl border-4 border-[#ba1a1a] bg-white p-6 shadow-2xl text-center">
        
        {/* Pulsating Alarm Icon Header */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#ba1a1a] text-white animate-bounce shadow-lg">
          <span className="material-symbols-outlined text-5xl">emergency</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ba1a1a]/10 px-3 py-1 text-xs font-black uppercase text-[#ba1a1a] mb-2">
          <span className="h-2 w-2 rounded-full bg-[#ba1a1a] animate-ping" />
          CẢNH BÁO TÍN HIỆU SOS KHẨN CẤP!
        </div>

        <h3 className="m-0 text-2xl font-black text-[#0b1c30]">
          {elderlyName} ĐÃ PHÁT TÍN HIỆU SOS!
        </h3>

        <p className="mt-2 text-sm font-semibold text-[#424754]">
          Tín hiệu khẩn cấp được gửi lúc <strong className="text-[#ba1a1a]">{timeString}</strong> ({activeSosEvent.triggeredBy === 'button' ? 'Nút bấm khẩn cấp' : 'Hệ thống tự động'}).
        </p>

        {/* GPS Maps Link Section */}
        {mapsLink && (
          <div className="mt-4 rounded-2xl border border-[#0058be]/30 bg-[#eff4ff] p-3 text-center">
            <p className="m-0 text-xs font-bold text-[#0058be] flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Vị trí GPS khẩn cấp của người thân:
            </p>
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0058be] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#00479e] transition"
            >
              <span className="material-symbols-outlined text-base">map</span>
              Mở Vị Trí GPS Trên Google Maps
            </a>
          </div>
        )}

        {/* Emergency Call Option */}
        {activeSosEvent.emergencyPhone && (
          <div className="mt-3">
            <a
              href={`tel:${activeSosEvent.emergencyPhone}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-50 py-3 text-sm font-bold text-green-700 hover:bg-green-100 transition"
            >
              <span className="material-symbols-outlined text-base">call</span>
              GỌI NGAY CHO NGƯỜI THÂN: {activeSosEvent.emergencyPhone}
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleAction('acknowledged')}
            disabled={isProcessing}
            className="flex-1 py-3.5 bg-[#ba1a1a] text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-[#961212] transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'Đang xử lý...' : 'XÁC NHẬN PHẢN HỒI NGAY'}
          </button>
          
          <button
            onClick={() => handleAction('resolved')}
            disabled={isProcessing}
            className="flex-1 py-3.5 border-2 border-[#006c49] bg-white text-[#006c49] font-bold text-sm rounded-2xl hover:bg-[#006c49]/10 transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'Đang xử lý...' : 'ĐÃ AN TOÀN - TẮT BÁO ĐỘNG'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default CaregiverSosAlertModal
