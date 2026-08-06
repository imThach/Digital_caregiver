import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import useCaregiverStore from '../../store/useCaregiverStore';
import { prescriptionApi } from '../../api/apiServices';
import ImageLightboxModal from '../../components/common/ImageLightboxModal';

export function Prescriptions() {
  const navigate = useNavigate();
  const { selectedElderly, fetchElderlyList } = useCaregiverStore();
  const patientNickname = selectedElderly?.nickname || selectedElderly?.fullName || 'Người cao tuổi';
  const elderlyId = selectedElderly?._id;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);

  // Image Lightbox State
  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  });

  const openLightbox = (imageUrl, title, subtitle) => {
    if (imageUrl) {
      setLightboxData({ isOpen: true, imageUrl, title, subtitle });
    }
  };

  const closeLightbox = () => {
    setLightboxData({ isOpen: false, imageUrl: '', title: '', subtitle: '' });
  };

  const fetchPrescriptionHistory = useCallback(async (id) => {
    try {
      const res = await prescriptionApi.getElderlyPrescriptions(id || 'my-elderly');
      if (res.data) {
        setPrescriptionsList(res.data.prescriptions || []);
        setMedicationsList(res.data.medications || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn thuốc:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      let currentElderlyId = elderlyId;
      if (!currentElderlyId) {
        const list = await fetchElderlyList();
        if (list && list.length > 0) {
          currentElderlyId = list[0]._id;
        }
      }
      fetchPrescriptionHistory(currentElderlyId);
    }
    init();
  }, [elderlyId, fetchElderlyList, fetchPrescriptionHistory]);

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn thuốc này? Tất cả các thuốc và lịch uống liên quan thuộc đơn thuốc sẽ bị xóa khỏi hệ thống.')) {
      return;
    }

    setDeletingId(prescriptionId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await prescriptionApi.deletePrescription(prescriptionId);
      setSuccessMessage('Đã xóa đơn thuốc và toàn bộ lịch uống thuốc liên quan thành công!');
      fetchPrescriptionHistory(elderlyId || 'my-elderly');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Xóa đơn thuốc thất bại, vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      handleUploadAndAnalyze(file);
    }
  };

  const handleUploadAndAnalyze = async (fileToUpload) => {
    const file = fileToUpload || selectedFile;
    if (!file) {
      setErrorMessage('Vui lòng chọn hình ảnh đơn thuốc để phân tích.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(15);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('image', file);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return 95;
        }
        return Math.min(95, prev + Math.floor(Math.random() * 10 + 5));
      });
    }, 400);

    try {
      const res = await prescriptionApi.analyzeImage(formData);
      clearInterval(interval);
      setProgress(100);

      const cloudImageUrl = res.data?.imageUrl || previewUrl;
      const extractedMeds = res.data?.extractedMedications || [];

      setTimeout(() => {
        navigate('/prescription-review', {
          state: {
            imageUrl: cloudImageUrl,
            extractedMedications: extractedMeds,
          },
        });
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setProgress(0);
      setErrorMessage(err.message || 'Phân tích hình ảnh thất bại. Đang mở trang xem lại mẫu...');

      setTimeout(() => {
        navigate('/prescription-review', {
          state: {
            imageUrl: previewUrl || 'https://placeholder.co/600x400?text=Prescription+Image',
            extractedMedications: [
              {
                name: 'Lisinopril 10mg',
                purpose: 'Huyết áp cao',
                dosage: '1 Viên',
                instructions: 'Uống sau bữa ăn sáng',
                scheduleTimes: ['08:00'],
              },
              {
                name: 'Metformin 500mg',
                purpose: 'Tểu đường Tuýp 2',
                dosage: '1 Viên',
                instructions: 'Uống cùng thức ăn',
                scheduleTimes: ['13:00'],
              },
            ],
          },
        });
      }, 1200);
    }
  };

  return (
    <MainLayout patientName={patientNickname}>
      {/* Page Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-3xl font-extrabold text-on-surface">
              Đơn Thuốc &amp; Trích Xuất Gemini AI
            </h1>
            <p className="font-body-lg text-outline mt-1">
              Tải ảnh đơn thuốc để AI tự động lưu lại trên Cloud, trích xuất thuốc & tạo lịch nhắc tự động.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 shadow-sm">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
          <span className="material-symbols-outlined text-lg">error</span>
          {errorMessage}
        </div>
      )}

      {/* Grid Layout */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Active Prescriptions Card */}
        <section className="col-span-12 lg:col-span-8">
          <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#737f90]">
                    Hồ sơ đơn thuốc
                  </span>
                </div>
                <h3 className="m-0 text-xl font-bold text-[#0b1c30]">
                  Danh sách đơn thuốc & thuốc đang uống
                </h3>
              </div>
            </div>

            {/* Prescriptions Cloud List */}
            {prescriptionsList.length > 0 ? (
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {prescriptionsList.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center gap-3 rounded-xl border border-[#c2c6d6]/60 bg-[#f8f9ff] p-3 transition hover:border-[#0058be]"
                    >
                      <div
                        onClick={() => openLightbox(p.imageUrl, p.title || `Đơn thuốc #${String(p._id).slice(-6)}`, `Tải lên ngày: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}`)}
                        className="group/img relative h-16 w-16 overflow-hidden rounded-lg border border-[#c2c6d6] bg-white shrink-0 cursor-zoom-in shadow-sm"
                        title="Bấm để xem ảnh đơn thuốc phóng to"
                      >
                        <img
                          src={p.imageUrl}
                          alt="Prescription Scan"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-base">zoom_in</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="m-0 truncate font-bold text-xs text-[#0b1c30]" title={p.title || `Đơn thuốc #${String(p._id).slice(-6)}`}>
                          {p.title || `Đơn thuốc #${String(p._id).slice(-6)}`}
                        </p>
                        <p className="m-0 text-[11px] text-[#737f90]">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            navigate('/prescription-review', {
                              state: {
                                prescriptionId: p._id,
                                imageUrl: p.imageUrl,
                                prescriptionTitle: p.title || 'Đơn thuốc khám bệnh',
                                extractedMedications: p.rawAiResponse || [],
                              },
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-[#0058be] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#00479e] cursor-pointer"
                          title="Chỉnh sửa đơn thuốc này"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeletePrescription(p._id)}
                          disabled={deletingId === p._id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100 cursor-pointer disabled:opacity-50"
                          title="Xóa đơn thuốc"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          {deletingId === p._id ? 'Xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Active Medications List */}
            <div className="space-y-3">
              <h4 className="m-0 text-sm font-bold uppercase tracking-wider text-[#737f90]">
                Danh mục thuốc đang hoạt động ({medicationsList.length})
              </h4>
              {medicationsList.length > 0 ? (
                medicationsList.map((med) => (
                  <div
                    key={med._id}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-[#f5f7fd] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => openLightbox(med.imageUrl, `Thuốc: ${med.name}`, `Công dụng/Liều dùng: ${med.usageNote || med.dosage || 'Đang sử dụng'}`)}
                        className="group/med relative h-12 w-12 overflow-hidden rounded-xl border border-[#c2c6d6] bg-white shrink-0 shadow-sm flex items-center justify-center cursor-zoom-in"
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
                      <div>
                        <p className="m-0 font-bold text-[#0b1c30]">{med.name}</p>
                        <p className="m-0 text-xs text-[#737f90]">
                          {med.usageNote || med.dosage} • Giờ uống:{' '}
                          {med.schedules?.map((s) => s.timeOfDay).join(', ') || '08:00'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-[#006c49]/10 px-3 py-1 text-xs font-bold text-[#006c49]">
                        Còn {med.remainingQuantity !== undefined ? med.remainingQuantity : (med.totalQuantity || 30)}/{med.totalQuantity || 30} viên
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#c2c6d6] p-6 text-center text-xs text-[#737f90]">
                  Chưa có thuốc nào. Vui lòng tải ảnh đơn thuốc bên phải để AI trích xuất tự động.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Upload Area */}
        <section className="col-span-12 lg:col-span-4">
          <div className="flex h-full flex-col">
            <label className="dashed-border group flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white p-6 text-center transition hover:bg-[#eff4ff]">
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#0058be] text-white shadow-lg transition group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <h3 className="m-0 text-lg font-bold text-[#0b1c30]">Tải ảnh đơn thuốc</h3>
              <p className="m-0 text-xs text-[#737f90] mb-2">Hỗ trợ JPG, PNG, PDF</p>

              <div className="flex items-center gap-2 rounded-xl bg-[#0058be] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Chọn ảnh đơn thuốc
              </div>
            </label>
          </div>
        </section>

        {/* AI Processing Banner */}
        {isAnalyzing && (
          <section className="col-span-12">
            <div className="rounded-2xl border border-[#0058be]/30 bg-[#eff4ff] p-6 shadow-sm ">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-10 w-10 animate-spin items-center justify-center rounded-lg bg-[#0058be] text-white">
                  <span className="material-symbols-outlined">sync</span>
                </div>
                <div>
                  <h3 className="m-0 text-lg font-bold text-black">
                    Gemini AI đang tải ảnh lên Cloud &amp; trích xuất đơn thuốc...
                  </h3>
                  <p className="m-0 text-xs text-[#424754] ">
                    Tự động lưu ảnh trên Cloud và bóc tách thông tin tên thuốc, liều dùng...
                  </p>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white ">
                <div
                  className="h-full rounded-full bg-[#0058be] transition-all duration-300 "
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-bold text-[#424754] ">
                <span>{progress}% Hoàn tất</span>
                <span>Tự động chuyển tới trang xác nhận đơn thuốc...</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* High-Resolution Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        imageUrl={lightboxData.imageUrl}
        title={lightboxData.title}
        subtitle={lightboxData.subtitle}
        onClose={closeLightbox}
      />
    </MainLayout>
  );
}

export default Prescriptions;
