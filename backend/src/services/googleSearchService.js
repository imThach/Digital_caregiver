/**
 * Dịch vụ tìm kiếm hình ảnh minh họa thuốc thực tế từ các nhà thuốc Việt Nam
 * (Tự động lấy ảnh vỏ hộp, vỉ thuốc, lọ siro thực tế - Không phụ thuộc Google API Key hay công thức hóa học Wikipedia)
 */

const DEFAULT_FALLBACK_IMAGES = {
    syrup: 'https://cdn.tgdd.vn/Products/Images/10029/130621/prospan-100ml-thumb-1-600x600.jpg',
    eyedrops: 'https://matbinhtam.vn/wp-content/uploads/105-thuoc-nho-mat-tri-dau-mat-do-4-1.png',
    cream: 'https://nhathuocanphuoc.com.vn/upload/product/thuoc-voltaren-emulgel-20g-diclofenac-diethylamine-116100g-2277.jpg',
    general: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
};

const getSmartFallbackImage = (medName = '') => {
    const lower = medName.toLowerCase();
    if (lower.includes('siro') || lower.includes('nước') || lower.includes('dung dịch')) {
        return DEFAULT_FALLBACK_IMAGES.syrup;
    }
    if (lower.includes('nhỏ mắt') || lower.includes('xịt')) {
        return DEFAULT_FALLBACK_IMAGES.eyedrops;
    }
    if (lower.includes('kem') || lower.includes('mỡ') || lower.includes('gel')) {
        return DEFAULT_FALLBACK_IMAGES.cream;
    }
    return DEFAULT_FALLBACK_IMAGES.general;
};

/**
 * Tìm kiếm hình ảnh sản phẩm thuốc thực tế từ các nhà thuốc
 * @param {string} medicationName - Tên thuốc (Ví dụ: "Paracetamol 500mg", "Amlodipin 5mg", "Siro Prospan")
 * @returns {Promise<string>} - Trả về URL hình ảnh vỏ hộp / chai thuốc thực tế
 */
export const searchMedicationImage = async (medicationName) => {
    if (!medicationName || !medicationName.trim()) {
        return getSmartFallbackImage();
    }

    try {
        const query = `${medicationName.trim()} thuốc`;
        const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iax=images&ia=images`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });

        const html = await tokenRes.text();
        const vqd = html.match(/vqd=([\d-]+)/)?.[1] || html.match(/vqd="([\d-]+)"/)?.[1] || html.match(/vqd='([\d-]+)'/)?.[1];

        if (vqd) {
            const imgUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
            const imgRes = await fetch(imgUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Referer': 'https://duckduckgo.com/',
                },
            });
            const imgData = await imgRes.json();
            if (imgData.results && imgData.results.length > 0) {
                const validImg = imgData.results.find(
                    (r) => r.image && (r.image.endsWith('.jpg') || r.image.endsWith('.png') || r.image.endsWith('.jpeg'))
                ) || imgData.results[0];

                if (validImg?.image) {
                    console.log(`[Medicine Image Search] Tìm thấy ảnh vỏ hộp thuốc thực tế cho "${medicationName}":`, validImg.image);
                    return validImg.image;
                }
            }
        }
    } catch (err) {
        console.error(`[Medicine Image Search Error] "${medicationName}":`, err.message);
    }

    return getSmartFallbackImage(medicationName);
};

/**
 * Bổ sung hình ảnh minh họa thực tế cho danh sách thuốc (xử lý song song)
 * @param {Array} medications 
 * @returns {Promise<Array>}
 */
export const enrichMedicationsWithImages = async (medications = []) => {
    if (!Array.isArray(medications) || medications.length === 0) return [];

    return Promise.all(
        medications.map(async (med) => {
            let imageUrl = med.imageUrl;

            if (!imageUrl && med.name) {
                imageUrl = await searchMedicationImage(med.name);
            }

            return {
                ...med,
                imageUrl: imageUrl || getSmartFallbackImage(med.name || ''),
            };
        })
    );
};
