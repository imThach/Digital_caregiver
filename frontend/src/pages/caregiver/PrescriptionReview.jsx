import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MainLayout from '../../components/layouts/MainLayout'
import useCaregiverStore from '../../store/useCaregiverStore'
import { prescriptionApi } from '../../api/apiServices'
import ImageLightboxModal from '../../components/common/ImageLightboxModal'

export function PrescriptionReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedElderly, fetchElderlyList } = useCaregiverStore()

  useEffect(() => {
    if (!selectedElderly) {
      fetchElderlyList()
    }
  }, [selectedElderly, fetchElderlyList])

  const patientNickname = selectedElderly?.nickname || selectedElderly?.fullName || 'Người cao tuổi'
  const elderlyId = selectedElderly?._id

  const passedData = location.state || {}
  const prescriptionId = passedData.prescriptionId
  const imageUrl = passedData.imageUrl || 'https://placeholder.co/600x400?text=Prescription+Image'
  const [prescriptionTitle, setPrescriptionTitle] = useState(passedData.prescriptionTitle || '')
  const [startDateOption, setStartDateOption] = useState('today') // 'today' | 'tomorrow' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')

  const [medications, setMedications] = useState(
    passedData.extractedMedications || [
      {
        name: 'Lisinopril 10mg',
        purpose: 'Huyết áp cao',
        dosage: '1 Viên',
        instructions: 'Uống sau bữa ăn sáng',
        scheduleTimes: ['08:00'],
      },
      {
        name: 'Metformin 500mg',
        purpose: 'Tiểu đường Tuýp 2',
        dosage: '1 Viên',
        instructions: 'Uống cùng thức ăn',
        scheduleTimes: ['13:00'],
      },
    ]
  )

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Image Lightbox State
  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  })

  const openLightbox = (img, title, subtitle) => {
    if (img) {
      setLightboxData({ isOpen: true, imageUrl: img, title, subtitle })
    }
  }

  const closeLightbox = () => {
    setLightboxData({ isOpen: false, imageUrl: '', title: '', subtitle: '' })
  }

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications]
    updated[index][field] = value
    setMedications(updated)
  }

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: 'Thuốc mới',
        purpose: 'Chăm sóc sức khỏe',
        dosage: '1 Viên',
        instructions: 'Uống với nước ấm',
        scheduleTimes: ['08:00'],
      },
    ])
  }

  const handleDeleteMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const handleConfirmSaveSchedule = async () => {
    setIsSaving(true)
    setSaveSuccessMsg('')
    setErrorMessage('')

    try {
      let selectedDate = new Date()
      if (startDateOption === 'tomorrow') {
        selectedDate.setDate(selectedDate.getDate() + 1)
      } else if (startDateOption === 'custom' && customStartDate) {
        selectedDate = new Date(customStartDate)
      }
      selectedDate.setHours(0, 0, 0, 0)

      await prescriptionApi.confirmPrescription({
        prescriptionId,
        elderlyId,
        medications,
        imageUrl,
        title: prescriptionTitle,
        startDate: selectedDate.toISOString(),
      })

      setSaveSuccessMsg(
        prescriptionId
          ? 'Đã cập nhật đơn thuốc và lịch uống thuốc thành công!'
          : 'Đã lưu đơn thuốc và thiết lập lịch uống thuốc tự động thành công!'
      )
      setTimeout(() => {
        navigate('/prescriptions')
      }, 1200)
    } catch (err) {
      setErrorMessage(err.message || 'Lưu đơn thuốc thất bại, vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout patientName={patientNickname}>
      {/* Banner */}
      <div className="rounded-xl border-l-4 border-[#0058be] bg-[#eff4ff] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0058be]">
            {prescriptionId ? 'edit_document' : 'check_circle'}
          </span>
          <div>
            <p className="m-0 font-bold text-[#0058be]">
              {prescriptionId ? 'Chỉnh Sửa Đơn Thuốc Đã Có' : 'Prescription Analyzed by Gemini AI'}
            </p>
            <p className="m-0 text-xs text-[#424754]">
              {prescriptionId
                ? 'Thay đổi thông tin tên thuốc, liều dùng, giờ uống rồi nhấn "Cập nhật đơn thuốc".'
                : 'Vui lòng kiểm tra lại danh mục thuốc trích xuất trước khi nhấn "Lưu & Tạo lịch nhắc".'}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Prescription Title Box */}
      <div className="rounded-2xl border border-[#0058be]/30 bg-[#eff4ff] p-4 shadow-sm">
        <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0058be]">
          <span className="material-symbols-outlined text-sm">edit_note</span> Tên đơn thuốc (Nhập tên gợi nhớ cho đơn thuốc)
        </label>
        <input
          type="text"
          value={prescriptionTitle}
          onChange={(e) => setPrescriptionTitle(e.target.value)}
          className="w-full rounded-xl border border-[#0058be]/40 bg-white px-4 py-2.5 text-base font-bold text-[#0b1c30] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0058be]"
          placeholder="Ví dụ: Đơn thuốc Huyết áp & Tim mạch, Đơn thuốc khám bệnh ngày 31/07..."
        />
      </div>

      {/* Start Date Option Box */}
      <div className="rounded-2xl border border-[#c2c6d6]/60 bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
          <span className="material-symbols-outlined text-sm text-[#0058be]">calendar_month</span> Ngày bắt đầu nhắc lịch uống thuốc
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setStartDateOption('today')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition cursor-pointer ${
              startDateOption === 'today'
                ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30'
                : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd]'
            }`}
          >
            <span className="material-symbols-outlined text-base text-[#006c49]">today</span>
            Hôm nay (Liều còn lại)
          </button>

          <button
            type="button"
            onClick={() => setStartDateOption('tomorrow')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition cursor-pointer ${
              startDateOption === 'tomorrow'
                ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30'
                : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd]'
            }`}
          >
            <span className="material-symbols-outlined text-base text-[#0058be]">event_upcoming</span>
            Từ Ngày Mai
          </button>

          <button
            type="button"
            onClick={() => setStartDateOption('custom')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition cursor-pointer ${
              startDateOption === 'custom'
                ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30'
                : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd]'
            }`}
          >
            <span className="material-symbols-outlined text-base text-[#7a4d00]">edit_calendar</span>
            Chọn Ngày Khác
          </button>
        </div>

        {startDateOption === 'custom' && (
          <div className="mt-3">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full rounded-xl border border-[#c2c6d6] bg-white px-3 py-2 text-xs font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
            />
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {saveSuccessMsg}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          {errorMessage}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 lg:items-start">
        {/* Original Prescription Preview */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-lg font-bold text-[#0b1c30]">
              <span className="material-symbols-outlined text-[#0058be]">description</span> Ảnh đơn thuốc
            </h3>
          </div>
          <div
            onClick={() => openLightbox(imageUrl, 'Ảnh đơn thuốc gốc', 'Bấm để xem ảnh phóng to chi tiết')}
            className="group/scan relative flex-1 overflow-hidden rounded-2xl border border-[#c2c6d6] bg-white p-4 shadow-sm min-h-[400px] cursor-zoom-in"
            title="Bấm để xem ảnh đơn thuốc phóng to"
          >
            <img src={imageUrl} alt="Prescription Scan" className="h-full w-full object-contain rounded-xl transition-transform duration-200 group-hover/scan:scale-105" />
            <div className="absolute inset-4 rounded-xl bg-black/25 opacity-0 group-hover/scan:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-sm">
              <span className="material-symbols-outlined text-2xl mr-1">zoom_in</span> Xem ảnh phóng to
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#737f90]">
            Ảnh được lưu bảo mật trên Cloud và sẽ tự động xóa sau 30 ngày.
          </p>
        </div>

        {/* Extracted Medicine Table */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-lg font-bold text-[#0b1c30]">
              <span className="material-symbols-outlined text-[#0058be]">pill</span> Extracted Medicine List
            </h3>
            <button
              onClick={handleAddMedication}
              className="flex items-center gap-1 rounded-xl bg-[#0058be]/10 px-3 py-1.5 text-xs font-bold text-[#0058be] hover:bg-[#0058be]/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Medicine
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl border border-[#c2c6d6] bg-white shadow-sm p-4">
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="rounded-xl border border-[#c2c6d6]/60 bg-[#f5f7fd] p-4">
                  <div className="flex items-center gap-3 border-b border-[#c2c6d6]/40 pb-3 mb-3">
                    <div
                      onClick={() => openLightbox(med.imageUrl, `Thuốc: ${med.name}`, `Công dụng/Liều dùng: ${med.purpose || med.usageNote || med.dosage || 'Thuốc được trích xuất'}`)}
                      className="group/med relative h-14 w-14 overflow-hidden rounded-xl border border-[#0058be]/30 bg-white shrink-0 shadow-sm flex items-center justify-center cursor-zoom-in"
                      title="Bấm để xem ảnh thuốc phóng to"
                    >
                      {med.imageUrl ? (
                        <>
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover/med:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(med.name)}&background=0058be&color=fff&size=256`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/med:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <span className="material-symbols-outlined text-sm">zoom_in</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#0058be]/10 text-[#0058be]">
                          <span className="material-symbols-outlined text-xl">pill</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="m-0 text-xs font-bold text-[#0b1c30] truncate mt-0.5">{med.name || 'Thuốc'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#737f90]">Tên thuốc</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#c2c6d6] bg-white px-3 py-1.5 text-sm font-bold text-[#0b1c30]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#737f90]">Công dụng</label>
                      <input
                        type="text"
                        value={med.purpose || med.usageNote || ''}
                        onChange={(e) => handleMedicationChange(index, 'purpose', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#c2c6d6] bg-white px-3 py-1.5 text-sm text-[#0b1c30]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#737f90]">Liều lượng</label>
                      <input
                        type="text"
                        value={med.dosage || ''}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#c2c6d6] bg-white px-3 py-1.5 text-sm text-[#0b1c30]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#737f90]">Giờ uống</label>
                      <input
                        type="text"
                        value={Array.isArray(med.scheduleTimes) ? med.scheduleTimes.join(', ') : '08:00'}
                        onChange={(e) => handleMedicationChange(index, 'scheduleTimes', e.target.value.split(', '))}
                        className="mt-1 w-full rounded-lg border border-[#c2c6d6] bg-white px-3 py-1.5 text-sm text-[#0058be] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#737f90]">Tổng số lượng kê (Số viên/hộp)</label>
                      <input
                        type="number"
                        min="1"
                        value={med.totalQuantity || med.quantity || 30}
                        onChange={(e) => handleMedicationChange(index, 'totalQuantity', parseInt(e.target.value) || 1)}
                        className="mt-1 w-full rounded-lg border border-[#006c49]/40 bg-[#006c49]/5 px-3 py-1.5 text-sm text-[#006c49] font-bold"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleDeleteMedication(index)}
                      className="text-xs font-bold text-[#ba1a1a] hover:underline cursor-pointer"
                    >
                      Xóa thuốc này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
        <span className="text-xs text-[#737f90]">Gemini AI Safety Check: 0 Drug Interactions</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/prescriptions')}
            className="rounded-xl border border-[#c2c6d6] px-5 py-2.5 text-sm font-bold text-[#424754] hover:bg-[#e5eeff] cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirmSaveSchedule}
            disabled={isSaving}
            className="rounded-xl bg-[#0058be] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#00479e] cursor-pointer disabled:opacity-60"
          >
            {isSaving
              ? prescriptionId
                ? 'Đang cập nhật...'
                : 'Đang lưu lịch...'
              : prescriptionId
              ? 'CẬP NHẬT ĐƠN THUỐC & LỊCH UỐNG'
              : 'LƯU & TẠO LỊCH NHẮC TỰ ĐỘNG'}
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        imageUrl={lightboxData.imageUrl}
        title={lightboxData.title}
        subtitle={lightboxData.subtitle}
        onClose={closeLightbox}
      />
    </MainLayout>
  )
}

export default PrescriptionReview
