# GHI CHÚ TRIỂN KHAI (DEPLOY NOTES)

Hệ thống được thiết kế để chạy trên một máy chủ Node.js (Express) tích hợp cơ sở dữ liệu Supabase và dịch vụ Resend.

## 1. Các biến môi trường (.env) cần cấu hình trên VPS
Tạo file `.env` tại thư mục chứa dự án trên VPS với nội dung sau:

```env
# Cấu hình Cổng lắng nghe
PORT=3000

# Supabase Credentials (Lấy từ Settings -> API trên Supabase Dashboard)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend API Key (Dùng để gửi email tự động)
RESEND_API_KEY=your_resend_api_key
```

## 2. Các lệnh khởi chạy server trên VPS
Sau khi cài đặt môi trường (Node.js & PM2), chạy các lệnh sau từ thư mục chứa dự án:

```bash
# 1. Cài đặt các thư viện/dependencies
npm install --production

# 2. Khởi chạy server và quản lý bằng PM2
pm2 start server.js --name "phongthuy-web"

# 3. Đảm bảo tự khởi động lại khi VPS reboot
pm2 startup
pm2 save
```

## 3. Cổng mạng và Truy cập
* **Cổng lắng nghe:** Mặc định server chạy tại cổng `3000` (hoặc cấu hình qua biến `PORT` trong `.env`).
* **Định tuyến các Endpoint API:**
  - Nhận webhook SePay: `/api/sepay-webhook`
  - Đăng ký waitlist: `/api/waitlist`
  - Tạo đơn hàng Admin: `/api/admin-create-order`
  - Gửi mail xác nhận: `/api/send-order-confirmation`
  - Test Resend: `/api/test-resend`
  - Cron gửi email marketing: `/api/cron-send-emails`
* **Định tuyến các trang Web sạch (Clean URLs):**
  - Trang chủ: `/` (trỏ đến `index.html`)
  - Admin: `/admin` (trỏ đến `admin.html`)
  - Sản phẩm: `/san-pham` hoặc `/sanpham` (trỏ đến `sanpham.html`)
  - Thanh toán: `/thanh-toan` (trỏ đến `thanh-toan.html`)
  - Cảm ơn: `/thank-you` & `/thank-you-mua-hang`
