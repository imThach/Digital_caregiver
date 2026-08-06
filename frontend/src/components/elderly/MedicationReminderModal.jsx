import React, { useEffect, useState } from 'react'
import ImageLightboxModal from '../common/ImageLightboxModal'

export function MedicationReminderModal({
  isOpen,
  medicationName = 'Thuốc',
  patientNickname = 'Bà',
  dosage = '1 viên (Uống sau ăn)',
  timeOfDay = '',
  pillImage,
  isTimeYet = true,
  onConfirmTake,
  onSnooze,
  onClose,
  speakFn,
}) {
  const [showLightbox, setShowLightbox] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const announceText = isTimeYet
        ? `${patientNickname} ơi, đến giờ uống thuốc ${medicationName}${timeOfDay ? ` lúc ${timeOfDay}` : ''} rồi ạ.`
        : `${patientNickname} ơi, thuốc ${medicationName} chưa tới giờ uống ạ. Giờ hẹn là ${timeOfDay}.`

      if (speakFn) {
        speakFn(announceText)
      } else {
        try {
          const directGoogleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(announceText.slice(0, 200))}&tl=vi&client=tw-ob`
          const audio = new Audio(directGoogleTtsUrl)
          audio.play().catch(() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              const utterance = new SpeechSynthesisUtterance(announceText)
              utterance.lang = 'vi-VN'
              utterance.rate = 0.95
              utterance.pitch = 1.25
              window.speechSynthesis.speak(utterance)
            }
          })
        } catch {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(announceText)
            utterance.lang = 'vi-VN'
            utterance.rate = 0.95
            utterance.pitch = 1.25
            window.speechSynthesis.speak(utterance)
          }
        }
      }
    }
  }, [isOpen, medicationName, patientNickname, timeOfDay, isTimeYet, speakFn])

  if (!isOpen) return null

  const displayImage =
    pillImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(medicationName)}&background=0058be&color=fff&size=256`

  return (
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all">
        <div className="relative w-[94vw] max-w-[640px] min-w-[320px] sm:min-w-[540px] shrink-0 rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-2xl border-4 border-[#0058be]/20 animate-in fade-in zoom-in-95 duration-200">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition cursor-pointer"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          )}

          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-wider ${
              isTimeYet ? 'bg-[#006c49]/10 text-[#006c49]' : 'bg-amber-100 text-amber-800'
            }`}
          >
            <span className={`h-3.5 w-3.5 rounded-full ${isTimeYet ? 'bg-[#006c49] animate-ping' : 'bg-amber-600'}`} />
            {isTimeYet ? 'ĐẾN GIỜ UỐNG THUỐC' : `CHƯA TỚI GIỜ UỐNG (${timeOfDay || 'HẸN SAU'})`}
          </div>

          <h2 className="mb-2 text-2xl sm:text-3xl font-black text-[#0b1c30] tracking-tight">
            {isTimeYet ? `${patientNickname} ơi, uống thuốc nhé!` : `Chưa tới giờ uống thuốc`}
          </h2>
          <p className="text-xl font-bold text-[#0058be] mb-1">{medicationName}</p>
          <p className="text-base font-semibold text-[#424754] mb-6">
            {dosage} {timeOfDay ? `• Giờ hẹn: ${timeOfDay}` : ''}
          </p>

          {/* Pill Image representation with Zoom Trigger */}
          <div className="relative mx-auto mb-8 group cursor-pointer w-44 h-44">
            <div
              onClick={() => setShowLightbox(true)}
              className="flex h-full w-full overflow-hidden items-center justify-center rounded-3xl border-4 border-[#0058be]/20 bg-white p-2 shadow-inner transition hover:border-[#0058be] hover:shadow-lg"
              title="Bấm để xem phóng to ảnh thuốc"
            >
              <img
                src={displayImage}
                alt={medicationName}
                className="h-full w-full object-cover rounded-2xl transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(medicationName)}&background=0058be&color=fff&size=256`
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-3xl flex items-center justify-center text-white font-bold transition duration-200 gap-1 text-sm">
                <span className="material-symbols-outlined text-2xl">zoom_in</span>
                Phóng to
              </div>
            </div>
            <span className="mt-2 block text-xs font-bold text-[#0058be]">🔍 Bấm vào hình để xem phóng to</span>
          </div>

          {/* 2 Large Action Buttons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
            <button
              onClick={onConfirmTake}
              disabled={!isTimeYet}
              className={`flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-lg sm:text-xl font-black text-white shadow-lg transition ${
                isTimeYet
                  ? 'bg-[#006c49] hover:bg-[#005539] active:scale-95 cursor-pointer'
                  : 'bg-gray-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">
                {isTimeYet ? 'check_circle' : 'lock'}
              </span>
              {isTimeYet ? 'ĐÃ UỐNG' : 'CHƯA TỚI GIỜ'}
            </button>

            <button
              onClick={onSnooze}
              disabled={!isTimeYet}
              className={`flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg sm:text-xl font-black text-white shadow-lg transition ${
                isTimeYet
                  ? 'bg-[#7a4d00] hover:bg-[#5f3c00] active:scale-95 cursor-pointer'
                  : 'bg-gray-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">
                {isTimeYet ? 'snooze' : 'lock_clock'}
              </span>
              {isTimeYet ? 'NHẮC LẠI SAU 10P' : 'CHƯA TỚI GIỜ'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      <ImageLightboxModal
        isOpen={showLightbox}
        imageUrl={displayImage}
        title={`Ảnh thuốc: ${medicationName}`}
        subtitle={`Liều dùng: ${dosage} ${timeOfDay ? `| Giờ hẹn: ${timeOfDay}` : ''}`}
        onClose={() => setShowLightbox(false)}
      />
    </>
  )
}

export default MedicationReminderModal
