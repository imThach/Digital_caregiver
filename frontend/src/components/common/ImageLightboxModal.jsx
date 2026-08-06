import React, { useEffect } from 'react';

export function ImageLightboxModal({ isOpen, imageUrl, title, subtitle, onClose }) {
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

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0b1c30] p-5 text-white shadow-2xl transition-transform animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0058be] text-white shadow-md">
                            <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="m-0 truncate text-base font-bold text-white">{title || 'Xem ảnh phóng to'}</h3>
                            {subtitle && <p className="m-0 truncate text-xs text-white/70">{subtitle}</p>}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
                        title="Đóng xem phóng to (Esc)"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Main Image Display */}
                <div className="relative flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/40 p-2 shadow-inner">
                    <img
                        src={imageUrl}
                        alt={title || 'Enlarged Preview'}
                        className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl transition-transform duration-300 hover:scale-105"
                    />
                </div>

                {/* Footer Controls */}
                <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#8df7c5]">verified</span>
                        Hình ảnh thực tế độ phân giải cao
                    </span>
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-[#0058be] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#00479e] cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImageLightboxModal;
