import React, { useState, useEffect } from 'react';

export function SettingsModal({ isOpen, onClose }) {
    const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'vi');
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('app_language', lang);
    };

    const handleThemeChange = (selectedTheme) => {
        setTheme(selectedTheme);
        localStorage.setItem('app_theme', selectedTheme);
        applyTheme(selectedTheme);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[500px] min-w-[320px] rounded-3xl border border-[#c2c6d6]/60 bg-white p-6 sm:p-7 shadow-2xl transition-transform animate-in zoom-in-95 duration-200 dark:bg-[#132740] dark:border-[#263c5a]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="mb-6 flex items-center justify-between border-b border-[#c2c6d6]/40 pb-4 dark:border-[#263c5a]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0058be]/10 text-[#0058be] dark:bg-[#0058be]/30 dark:text-[#8df7c5]">
                            <span className="material-symbols-outlined text-2xl">settings</span>
                        </div>
                        <div>
                            <h3 className="m-0 text-lg font-bold text-[#0b1c30] dark:text-white">Cài đặt ứng dụng</h3>
                            <p className="m-0 text-xs text-[#737f90] dark:text-[#a3b1c6]">Tùy chỉnh giao diện và ngôn ngữ</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f7fd] text-[#424754] transition hover:bg-[#e5eeff] hover:text-[#0058be] dark:bg-[#1a3250] dark:text-white cursor-pointer"
                        title="Đóng cài đặt (Esc)"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="space-y-6">
                    {/* Section 1: Language Selection */}
                    <div>
                        <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737f90] dark:text-[#a3b1c6]">
                            <span className="material-symbols-outlined text-sm">language</span>
                            Ngôn ngữ (Language)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleLanguageChange('vi')}
                                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition cursor-pointer ${
                                    language === 'vi'
                                        ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30 dark:bg-[#0058be]/30 dark:text-white'
                                        : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd] dark:bg-[#1a3250] dark:border-[#263c5a] dark:text-[#a3b1c6]'
                                }`}
                            >
                                <span className="text-lg">🇻🇳</span>
                                Tiếng Việt
                            </button>

                            <button
                                type="button"
                                onClick={() => handleLanguageChange('en')}
                                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition cursor-pointer ${
                                    language === 'en'
                                        ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30 dark:bg-[#0058be]/30 dark:text-white'
                                        : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd] dark:bg-[#1a3250] dark:border-[#263c5a] dark:text-[#a3b1c6]'
                                }`}
                            >
                                <span className="text-lg">🇬🇧</span>
                                English
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Theme Light / Dark Mode */}
                    <div>
                        <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737f90] dark:text-[#a3b1c6]">
                            <span className="material-symbols-outlined text-sm">contrast</span>
                            Chế độ giao diện (Appearance)
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => handleThemeChange('light')}
                                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                                    theme === 'light'
                                        ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30 dark:bg-[#0058be]/30 dark:text-white'
                                        : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd] dark:bg-[#1a3250] dark:border-[#263c5a] dark:text-[#a3b1c6]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl text-amber-500">light_mode</span>
                                <span className="text-center">Giao diện Sáng</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleThemeChange('dark')}
                                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                                    theme === 'dark'
                                        ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30 dark:bg-[#0058be]/30 dark:text-white'
                                        : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd] dark:bg-[#1a3250] dark:border-[#263c5a] dark:text-[#a3b1c6]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl text-indigo-400">dark_mode</span>
                                <span className="text-center">Giao diện Tối</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleThemeChange('system')}
                                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                                    theme === 'system'
                                        ? 'border-[#0058be] bg-[#0058be]/10 text-[#0058be] ring-2 ring-[#0058be]/30 dark:bg-[#0058be]/30 dark:text-white'
                                        : 'border-[#c2c6d6]/60 bg-white text-[#424754] hover:bg-[#f5f7fd] dark:bg-[#1a3250] dark:border-[#263c5a] dark:text-[#a3b1c6]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl text-emerald-500">desktop_windows</span>
                                <span className="text-center">Theo Hệ thống</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-8 flex justify-end border-t border-[#c2c6d6]/40 pt-4 dark:border-[#263c5a]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-[#0058be] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00479e] active:scale-95 cursor-pointer"
                    >
                        Hoàn tất &amp; Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}

export function applyTheme(selectedTheme) {
    const root = document.documentElement;
    const theme = selectedTheme || localStorage.getItem('app_theme') || 'light';

    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export default SettingsModal;
