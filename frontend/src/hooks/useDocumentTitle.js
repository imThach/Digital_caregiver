import { useEffect } from 'react'

const BASE_TITLE = 'Digital Caregiver'

/**
 * Hook cập nhật document.title cho mỗi page.
 * Khi unmount sẽ reset về title mặc định.
 *
 * @param {string} title - Tiêu đề trang (sẽ hiển thị dạng "title | Digital Caregiver")
 *
 * @example
 * useDocumentTitle('Bảng điều khiển')
 * // document.title → "Bảng điều khiển | Digital Caregiver"
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE

    return () => {
      document.title = previousTitle
    }
  }, [title])
}

export default useDocumentTitle
