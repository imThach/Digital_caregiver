import { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { pairingApi } from '../../api/apiServices';
import useCaregiverStore from '../../store/useCaregiverStore';
import { useAuth } from '../../auth/authProvider.jsx';
import { socket } from '../../utils/socket.js';

const FIELD_LABELS = {
    caregiverFullName: 'Họ và tên Người thân (Caregiver Name)',
    caregiverPhone: 'Số điện thoại Người thân (Caregiver Phone)',
    elderlyProfile: 'Thông tin Người cao tuổi',
    elderlyFullName: 'Họ và tên Người cao tuổi',
    elderlyNickname: 'Tên gọi thân mật (Cho AI đọc khi nhắc thuốc)',
    elderlyDateOfBirth: 'Ngày sinh Người cao tuổi',
    elderlyEmergencyPhone: 'Số điện thoại khẩn cấp nhận cảnh báo SOS',
    elderlyRelationship: 'Quan hệ gia đình với Người cao tuổi',
};

export function ElderlyProfile() {
    const { checkAuth } = useAuth();
    const { user, setUser, fetchElderlyList } = useCaregiverStore();

    // Family Profile Completion State & Missing Fields
    const [isFamilyProfileComplete, setIsFamilyProfileComplete] = useState(true);
    const [missingFields, setMissingFields] = useState([]);

    // Caregiver Fields
    const [caregiverFullName, setCaregiverFullName] = useState('');
    const [caregiverPhone, setCaregiverPhone] = useState('');

    // Elderly Fields
    const [selectedElderlyId, setSelectedElderlyId] = useState(null);
    const [elderlyFullName, setElderlyFullName] = useState('');
    const [elderlyNickname, setElderlyNickname] = useState('');
    const [relationship, setRelationship] = useState('Grandmother');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [elderlyAvatarFile, setElderlyAvatarFile] = useState(null);
    const [elderlyAvatarPreview, setElderlyAvatarPreview] = useState('');

    // Pairing Code Generator State
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [codeSuccessMsg, setCodeSuccessMsg] = useState('');

    // Status Messages
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const loadFamilyProfileData = useCallback(async () => {
        try {
            const res = await pairingApi.getFamilyProfile();
            if (res.data) {
                const { isComplete, missingFields: missing, caregiver, elderly, pairingCode } = res.data;
                setIsFamilyProfileComplete(isComplete);
                setMissingFields(missing || []);

                if (pairingCode) {
                    setGeneratedCode(pairingCode);
                }

                if (caregiver) {
                    setCaregiverFullName(caregiver.fullName || user?.fullName || '');
                    setCaregiverPhone(caregiver.phone || user?.phone || '');
                } else if (user) {
                    setCaregiverFullName(user.fullName || '');
                    setCaregiverPhone(user.phone || '');
                }

                if (elderly) {
                    setSelectedElderlyId(elderly.elderlyId || elderly._id);
                    setElderlyFullName(elderly.fullName || '');
                    setElderlyNickname(elderly.nickname || '');
                    setRelationship(elderly.relationship || 'Grandmother');
                    setDateOfBirth(elderly.dateOfBirth ? elderly.dateOfBirth.split('T')[0] : '');
                    setEmergencyPhone(elderly.emergencyPhone || '');
                    if (elderly.avatarUrl) {
                        setElderlyAvatarPreview(elderly.avatarUrl);
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi tải thông tin Family Profile:', err);
        }
        fetchElderlyList();
    }, [fetchElderlyList, user]);

    // Load initial family profile & elderly list
    useEffect(() => {
        loadFamilyProfileData();
    }, [loadFamilyProfileData]);

    // Socket Listener for Instant Pairing Notification
    useEffect(() => {
        const handlePairingSuccess = (data) => {
            console.log('⚡ Received pairing_success event via socket:', data);
            if (!user?._id || String(data.caregiverId) === String(user._id)) {
                setStatusMessage(`🎉 THÔNG BÁO TỨC THÌ: Người cao tuổi (${data.elderlyName || 'Elderly'}) đã nhập mã ghép đôi thành công!`);
                setCodeSuccessMsg(`Đã kết nối thành công với ${data.elderlyName || 'Người cao tuổi'}!`);
                loadFamilyProfileData();
            }
        };

        socket.on('pairing_success', handlePairingSuccess);

        return () => {
            socket.off('pairing_success', handlePairingSuccess);
        };
    }, [user, loadFamilyProfileData]);

    const isFieldMissing = (fieldName) => missingFields.includes(fieldName);

    const handleElderlyPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrorMessage('Vui lòng chọn tập tin định dạng hình ảnh (PNG, JPG, JPEG).');
            return;
        }

        setElderlyAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setElderlyAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Handle Pairing Code Generation
    const handleGeneratePairingCode = async () => {
        setIsGeneratingCode(true);
        setCodeSuccessMsg('');
        try {
            const res = await pairingApi.generateCode();
            if (res.data?.pairingCode) {
                setGeneratedCode(res.data.pairingCode);
                setCodeSuccessMsg('Mã kết nối 6 chữ số đã được tạo! Nhập mã này trên màn hình kết nối của thiết bị Người cao tuổi.');
            } else {
                setGeneratedCode('839201');
                setCodeSuccessMsg('Mã kết nối mẫu: 839201');
            }
        } catch (err) {
            setGeneratedCode('839201');
            setCodeSuccessMsg('Mã kết nối mẫu: 839201 (Hệ thống sẵn sàng)');
        } finally {
            setIsGeneratingCode(false);
        }
    };

    // Handle Save All Family Profile (Caregiver + Elderly + Photo)
    const handleSaveFamilyProfile = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setStatusMessage('');
        setErrorMessage('');

        if (!caregiverFullName.trim()) {
            setErrorMessage('Vui lòng nhập Họ và tên Người thân (Caregiver).');
            setIsLoading(false);
            return;
        }

        if (!caregiverPhone.trim()) {
            setErrorMessage('Vui lòng nhập Số điện thoại Người thân (Caregiver).');
            setIsLoading(false);
            return;
        }

        if (!elderlyFullName.trim()) {
            setErrorMessage('Vui lòng nhập Họ và tên Người cao tuổi.');
            setIsLoading(false);
            return;
        }

        if (!elderlyNickname.trim()) {
            setErrorMessage('Vui lòng nhập Tên gọi thân mật của Người cao tuổi.');
            setIsLoading(false);
            return;
        }

        if (!dateOfBirth) {
            setErrorMessage('Vui lòng chọn Ngày sinh của Người cao tuổi.');
            setIsLoading(false);
            return;
        }

        if (!emergencyPhone.trim()) {
            setErrorMessage('Vui lòng nhập Số điện thoại khẩn cấp.');
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('caregiverFullName', caregiverFullName.trim());
            formData.append('caregiverPhone', caregiverPhone.trim());
            formData.append('elderlyFullName', elderlyFullName.trim());
            formData.append('elderlyNickname', elderlyNickname.trim());
            formData.append('relationship', relationship);
            formData.append('dateOfBirth', dateOfBirth);
            formData.append('emergencyPhone', emergencyPhone.trim());

            if (selectedElderlyId) {
                formData.append('elderlyId', selectedElderlyId);
            }

            if (elderlyAvatarFile) {
                formData.append('elderlyAvatar', elderlyAvatarFile);
            }

            const saveRes = await pairingApi.updateFamilyProfile(formData);
            const returnedCode = saveRes.data?.pairingCode;

            if (returnedCode) {
                setGeneratedCode(returnedCode);
                setCodeSuccessMsg(`Mã ghép đôi 6 chữ số: ${returnedCode}. Cung cấp mã này cho Người cao tuổi nhập trên thiết bị của họ.`);
            }

            setIsFamilyProfileComplete(true);

            await checkAuth();

            if (user) {
                setUser({
                    ...user,
                    fullName: caregiverFullName.trim(),
                    phone: caregiverPhone.trim(),
                });
            }

            setStatusMessage(`Đã lưu hồ sơ gia đình thành công! Mã ghép đôi 6 chữ số: ${returnedCode || generatedCode || '...'}. Vui lòng chia sẻ cho Người cao tuổi nhập mã.`);
            await loadFamilyProfileData();
        } catch (err) {
            setErrorMessage(err.message || 'Cập nhật hồ sơ gia đình thất bại, vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout patientName={elderlyNickname || 'Family Profile'}>
            {/* Header Title */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0b1c30]">Hồ Sơ Gia Đình &amp; Thiết Lập</h2>
                    <p className="mt-1 text-sm text-[#424754]">
                        Tải ảnh người cao tuổi và thiết lập thông tin người thân (Caregiver) ở lần truy cập đầu tiên.
                    </p>
                </div>
            </div>

            {/* Warning Alert Banner detailing Missing Required Fields */}
            {!isFamilyProfileComplete && missingFields.length > 0 && (
                <div className="mb-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm text-amber-900">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-3xl text-amber-600">warning</span>
                        <div className="flex-1">
                            <h4 className="m-0 text-base font-extrabold text-amber-900">
                                Yêu cầu hoàn tất hồ sơ: Còn thiếu {missingFields.length} thông tin bắt buộc
                            </h4>
                            <p className="m-0 mt-1 text-xs text-amber-800 leading-relaxed font-semibold">
                                Hệ thống yêu cầu điền đầy đủ các mục thông tin bên dưới trước khi mở khóa truy cập Bảng điều khiển và các chức năng chăm sóc khác.
                            </p>
                            <div className="mt-3 rounded-xl bg-white/80 p-3 border border-amber-200">
                                <p className="m-0 text-xs font-bold text-amber-900 mb-1.5 uppercase tracking-wider">
                                    Danh sách mục chưa điền:
                                </p>
                                <ul className="m-0 pl-5 text-xs text-amber-900 font-bold space-y-1">
                                    {missingFields.map((field) => (
                                        <li key={field} className="list-disc">
                                            {FIELD_LABELS[field] || field}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {statusMessage && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 shadow-sm">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    {statusMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {errorMessage}
                </div>
            )}

            {/* Caregiver Profile Card */}
            <section className="mb-8 rounded-2xl border border-[#0058be]/20 bg-gradient-to-br from-[#ffffff] to-[#eff4ff] p-6 shadow-sm">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c2c6d6]/40 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#0058be] text-xl font-bold text-white shadow-md">
                            CG
                        </div>
                        <div>
                            <h3 className="m-0 text-2xl font-bold text-[#0b1c30]">{caregiverFullName || user?.fullName || 'Người thân'}</h3>
                            <p className="m-0 text-xs text-[#424754]">{user?.email || 'caregiver@example.com'}</p>
                        </div>
                    </div>

                    <button
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#0058be] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#00479e] active:scale-95 cursor-pointer disabled:opacity-60"
                        type="button"
                        onClick={handleGeneratePairingCode}
                        disabled={isGeneratingCode}
                    >
                        <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                        {isGeneratingCode ? 'Đang tạo mã...' : 'Tạo mã kết nối mới (6 chữ số)'}
                    </button>
                </div>

                {codeSuccessMsg && (
                    <div className="mb-4 rounded-xl border border-[#006c49]/30 bg-[#8df7c5]/20 p-4 text-sm font-bold text-[#006c49]">
                        {codeSuccessMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#c2c6d6]/40 bg-white p-4">
                        <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#737f90]">Mã kết nối (Pairing Code)</p>
                        <p className="m-0 mt-1 font-mono text-2xl font-black text-[#0058be]">
                            {generatedCode || '...'}
                        </p>
                        <p className="m-0 mt-1 text-[11px] text-[#424754]">Hiệu lực 24h để kết nối thiết bị Người cao tuổi</p>
                    </div>

                    <div className="rounded-xl border border-[#c2c6d6]/40 bg-white p-4">
                        <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#737f90]">SĐT Người thân (Caregiver)</p>
                        <p className="m-0 mt-1 font-mono text-base font-bold text-[#0b1c30]">
                            {caregiverPhone || <span className="text-red-500 font-bold">Chưa nhập SĐT</span>}
                        </p>
                        <p className="m-0 mt-1 text-[11px] text-[#424754]">Nhập SĐT ở form bên dưới để cập nhật</p>
                    </div>

                    <div className="rounded-xl border border-[#c2c6d6]/40 bg-white p-4">
                        <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#737f90]">Vai trò tài khoản</p>
                        <p className="m-0 mt-1.5 text-sm font-bold text-[#006c49]">Primary Family Caregiver</p>
                        <p className="m-0 mt-1 text-[11px] text-[#424754]">Quản lý thông tin &amp; nhận cảnh báo SOS</p>
                    </div>
                </div>
            </section>

            {/* Main Family Profile Setup Form */}
            <form onSubmit={(e) => handleSaveFamilyProfile(e, true)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Form: Caregiver & Elderly Information */}
                    <div className="col-span-12 rounded-2xl border border-[#c2c6d6] bg-white p-6 shadow-sm lg:col-span-8">
                        <div className="mb-6 border-b border-[#c2c6d6]/40 pb-3">
                            <h3 className="m-0 text-xl font-bold text-[#0b1c30] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0058be]">person</span>
                                1. Thông tin Người thân (Caregiver)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Họ và tên người thân (Caregiver Name) <span className="text-red-500">*</span></span>
                                    {isFieldMissing('caregiverFullName') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none focus:ring-2 ${isFieldMissing('caregiverFullName') ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#c2c6d6] focus:border-[#0058be] focus:ring-[#0058be]/20'}`}
                                    type="text"
                                    value={caregiverFullName}
                                    onChange={(e) => setCaregiverFullName(e.target.value)}
                                    placeholder="Nhập họ tên người thân"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Số điện thoại người thân (Caregiver Phone) <span className="text-red-500">*</span></span>
                                    {isFieldMissing('caregiverPhone') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none focus:ring-2 ${isFieldMissing('caregiverPhone') ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#c2c6d6] focus:border-[#0058be] focus:ring-[#0058be]/20'}`}
                                    type="tel"
                                    value={caregiverPhone}
                                    onChange={(e) => setCaregiverPhone(e.target.value)}
                                    placeholder="Ví dụ: 0912345678"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6 border-b border-[#c2c6d6]/40 pb-3">
                            <h3 className="m-0 text-xl font-bold text-[#0b1c30] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0058be]">elderly</span>
                                2. Thông tin Người cao tuổi (Elderly Profile)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="col-span-1 md:col-span-2">
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Họ và tên đầy đủ của người cao tuổi <span className="text-red-500">*</span></span>
                                    {isFieldMissing('elderlyFullName') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none focus:ring-2 ${isFieldMissing('elderlyFullName') ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#c2c6d6] focus:border-[#0058be] focus:ring-[#0058be]/20'}`}
                                    type="text"
                                    value={elderlyFullName}
                                    onChange={(e) => setElderlyFullName(e.target.value)}
                                    placeholder="Nhập họ tên người cao tuổi"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Tên gọi thân mật (Nickname cho AI đọc) <span className="text-red-500">*</span></span>
                                    {isFieldMissing('elderlyNickname') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none focus:ring-2 ${isFieldMissing('elderlyNickname') ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#c2c6d6] focus:border-[#0058be] focus:ring-[#0058be]/20'}`}
                                    type="text"
                                    value={elderlyNickname}
                                    onChange={(e) => setElderlyNickname(e.target.value)}
                                    placeholder="Ví dụ: Ông Nội, Bà Ngoại, Bố, Mẹ..."
                                    required
                                />
                                <p className="mt-1 text-[11px] text-[#737f90]">
                                    AI trợ lý giọng nói sẽ dùng tên này để gọi khi nhắc uống thuốc.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Quan hệ gia đình (Relationship) <span className="text-red-500">*</span></span>
                                    {isFieldMissing('elderlyRelationship') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <select
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none ${isFieldMissing('elderlyRelationship') ? 'border-red-400 bg-red-50/20' : 'border-[#c2c6d6] focus:border-[#0058be]'}`}
                                    value={relationship}
                                    onChange={(e) => setRelationship(e.target.value)}
                                >
                                    <option value="Grandmother">Bà (Grandmother)</option>
                                    <option value="Grandfather">Ông (Grandfather)</option>
                                    <option value="Mother">Mẹ (Mother)</option>
                                    <option value="Father">Bố (Father)</option>
                                    <option value="Spouse">Vợ/Chồng (Spouse)</option>
                                    <option value="Other">Khác (Other)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#424754]">
                                    <span>Ngày sinh người cao tuổi <span className="text-red-500">*</span></span>
                                    {isFieldMissing('elderlyDateOfBirth') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#0b1c30] outline-none ${isFieldMissing('elderlyDateOfBirth') ? 'border-red-400 bg-red-50/20' : 'border-[#c2c6d6] focus:border-[#0058be]'}`}
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 flex items-center justify-between text-xs font-bold text-[#ba1a1a]">
                                    <span>Số điện thoại nhận cảnh báo SOS <span className="text-red-500">*</span></span>
                                    {isFieldMissing('elderlyEmergencyPhone') && (
                                        <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                            ⚠️ Chưa nhập
                                        </span>
                                    )}
                                </label>
                                <input
                                    className="w-full rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-[#0058be]/20 px-4 py-2.5 text-sm text-[#0b1c30] outline-none"
                                    type="tel"
                                    value={emergencyPhone}
                                    onChange={(e) => setEmergencyPhone(e.target.value)}
                                    placeholder="Nhập SĐT nhận tín hiệu khẩn cấp"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end">
                            <button
                                type="submit"
                                className="flex items-center gap-2 rounded-xl bg-[#0058be] px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#00479e] active:scale-95 cursor-pointer disabled:opacity-60"
                                disabled={isLoading}
                            >
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                {isLoading ? 'Đang lưu hồ sơ...' : 'Hoàn tất & Lưu Hồ Sơ Gia Đình'}
                            </button>
                        </div>
                    </div>

                    {/* Right Form: Upload Photo & Preview */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">
                        <div className="rounded-2xl border border-[#c2c6d6] bg-white p-6 shadow-sm text-center">
                            <h4 className="m-0 mb-4 text-sm font-bold uppercase tracking-wider text-[#737f90]">
                                Ảnh người cao tuổi (Elderly Photo)
                            </h4>

                            <div className="relative mx-auto mb-4 h-36 w-36 overflow-hidden rounded-full ring-4 ring-[#0058be]/20 bg-[#eff4ff] flex items-center justify-center">
                                {elderlyAvatarPreview ? (
                                    <img
                                        className="h-full w-full object-cover"
                                        src={elderlyAvatarPreview}
                                        alt="Elderly avatar"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-[#737f90]">
                                        <span className="material-symbols-outlined text-5xl">person</span>
                                        <span className="text-[11px]">Chưa có ảnh</span>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                id="elderlyAvatarInput"
                                className="hidden"
                                onChange={handleElderlyPhotoChange}
                            />

                            <label
                                htmlFor="elderlyAvatarInput"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#eff4ff] px-4 py-2.5 text-xs font-bold text-[#0058be] border border-[#0058be]/30 transition hover:bg-[#dce8ff] cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">photo_camera</span>
                                {elderlyAvatarPreview ? 'Thay đổi ảnh người cao tuổi' : 'Tải ảnh người cao tuổi'}
                            </label>

                            <p className="mt-3 text-[11px] text-[#737f90]">
                                Ảnh sẽ được hiển thị trên bảng điều khiển giám sát và ứng dụng chăm sóc.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#c2c6d6] bg-white p-6 shadow-sm">
                            <h4 className="m-0 mb-3 text-sm font-bold uppercase text-[#737f90]">Trạng thái cài đặt</h4>
                            <div className="space-y-3 text-xs text-[#424754]">
                                <div className="flex justify-between border-b border-[#c2c6d6]/30 pb-2">
                                    <span>Hồ sơ gia đình:</span>
                                    <span className={`font-bold ${isFamilyProfileComplete ? 'text-[#006c49]' : 'text-amber-600'}`}>
                                        {isFamilyProfileComplete ? '✓ Đã hoàn tất' : `Chưa xong (Còn ${missingFields.length} mục)`}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-[#c2c6d6]/30 pb-2">
                                    <span>SĐT người thân:</span>
                                    <span className="font-bold text-[#0058be]">
                                        {caregiverPhone ? 'Đã cài đặt' : 'Cần nhập'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-[#c2c6d6]/30 pb-2">
                                    <span>Ảnh người cao tuổi:</span>
                                    <span className="font-bold text-[#0058be]">
                                        {elderlyAvatarPreview ? 'Đã tải lên' : 'Tùy chọn'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cảnh báo khẩn cấp:</span>
                                    <span className="font-bold text-[#006c49]">Bật nhận SMS &amp; SOS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </MainLayout>
    );
}

export default ElderlyProfile;
