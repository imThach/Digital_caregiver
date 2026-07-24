# Digital Caregiver

Digital Caregiver là ứng dụng hỗ trợ người cao tuổi uống thuốc đúng giờ, tương tác bằng giọng nói và gửi cảnh báo cho người thân khi cần thiết.

## Tech Stack

### Frontend

- React + Vite
- React Router DOM
- Tailwind CSS
- Axios
- Zustand
- Socket.IO Client
- Web Speech API
- Geolocation API

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- Redis + BullMQ
- Socket.IO
- JWT + Google OAuth
- Gemini API
- Cloudinary
- Nodemailer

## Chức năng nổi bật

### Đăng nhập và kết nối thiết bị

- Người thân đăng nhập bằng tài khoản Google.
- Hệ thống tạo mã kết nối gồm 6 chữ số.
- Người cao tuổi nhập mã để liên kết thiết bị với người thân.
- Người thân thiết lập tên gọi, danh sách thuốc và thông tin liên hệ khẩn cấp.

### Phân tích đơn thuốc bằng AI

- Người thân tải ảnh đơn thuốc hoặc sổ khám bệnh.
- Backend gửi ảnh đến Gemini API để phân tích.
- AI trích xuất tên thuốc, công dụng, liều lượng và thời điểm uống.
- Người thân kiểm tra, chỉnh sửa và xác nhận trước khi lưu.
- Hệ thống tự động tạo lịch nhắc thuốc từ dữ liệu đã xác nhận.

### Nhắc uống thuốc

- Đến giờ uống thuốc, ứng dụng phát lời nhắc bằng giọng nói.
- Hiển thị tên, liều lượng và hình ảnh nhận diện thuốc.
- Người cao tuổi có thể chọn **Đã uống** hoặc **Nhắc lại sau 10 phút**.
- Trạng thái uống thuốc được cập nhật theo thời gian thực trên dashboard của người thân.

### Cảnh báo bỏ lỡ thuốc

- Hệ thống tự động kiểm tra những lần uống chưa được xác nhận.
- Nếu quá 30 phút, lần uống được đánh dấu là bỏ lỡ.
- Người thân nhận push notification và email cảnh báo.
- Các tác vụ nhắc thuốc được xử lý bằng Redis và BullMQ.

### Trợ lý giọng nói Gemini

- Người cao tuổi đặt câu hỏi bằng giọng nói.
- Web Speech API chuyển giọng nói thành văn bản.
- Backend gửi câu hỏi cùng dữ liệu cần thiết đến Gemini.
- Câu trả lời được hiển thị và đọc lại bằng Text-to-Speech.
- Trợ lý chỉ cung cấp thông tin hỗ trợ, không thay thế bác sĩ hoặc tự thay đổi liều thuốc.

### SOS khẩn cấp

- Kích hoạt bằng nút **SOS** hoặc câu lệnh **“Cứu tôi với”**.
- Ứng dụng lấy vị trí hiện tại bằng Geolocation API.
- Người thân nhận cảnh báo kèm liên kết Google Maps.
- Cảnh báo được gửi qua Socket.IO, push notification và email.

### Dashboard và báo cáo

- Theo dõi thuốc đã uống, đang chờ và đã bỏ lỡ.
- Cập nhật trạng thái theo thời gian thực.
- Xem lịch sử uống thuốc theo ngày, tuần và tháng.
- Thống kê tỷ lệ uống đúng giờ và số lần bỏ lỡ.
- Theo dõi lịch sử cảnh báo và sự kiện SOS.

## Vai trò người dùng

- **Caregiver:** quản lý hồ sơ, đơn thuốc, lịch uống, báo cáo và cảnh báo.
- **Elderly:** nhận nhắc thuốc, xác nhận uống thuốc, sử dụng trợ lý giọng nói và kích hoạt SOS.
