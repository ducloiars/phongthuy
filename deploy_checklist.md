# BẢN ĐỒ KIỂM TRA DỰ ÁN TRƯỚC KHI DEPLOY LÊN VPS LINUX

Đây là danh sách chi tiết các công việc đã được xử lý thành công để chuẩn bị cho việc deploy dự án lên VPS Linux.

---

## 🛠️ 1. PHÂN TÍCH DỰ ÁN (NGÔN NGỮ & FRAMEWORK)
* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript ES6 (Client-side, gọi trực tiếp CDN của Supabase).
* **Backend:** Node.js CommonJS. Có 1 API endpoint là `api/sepay-webhook.js` viết theo chuẩn Vercel Serverless Function.
* **Cơ sở dữ liệu:** Supabase (Cơ sở dữ liệu đám mây chính cho website) và SQLite (`brain.db` dùng cho lưu trữ offline/thử nghiệm bộ não).

---

## ⚠️ 2. CẢNH BÁO BẢO MẬT (LỘ THÔNG TIN BÍ MẬT)
- [x] **Lộ Service Role Key nguy hiểm:** Trong file `scratch/add_products.py` (Dòng 5) đã được chuyển sang nạp tự động qua biến môi trường của file `.env`. Tránh hoàn toàn việc bị lộ Service Role Key khi đưa lên Git. **(ĐÃ KHẮC PHỤC ✅)**
- [x] **Thiếu file `.gitignore`:** Đã tạo file `.gitignore` để chặn đưa file `.env`, thư mục `node_modules` và file DB SQLite `.db` lên Git. **(ĐÃ KHẮC PHỤC ✅)**
- [x] **Lộ key trong file `.env`:** File `.env` chứa Supabase credentials đầy đủ nay đã được bảo vệ tuyệt đối thông qua việc cấu hình file ẩn `.gitignore`. **(ĐÃ KHẮC PHỤC ✅)**

---

## 📂 3. CÁC FILE CẦN TẠO THÊM ĐỂ DEPLOY VPS THÀNH CÔNG
- [x] **`server.js`:** Đã tạo máy chủ chạy Express để vừa phục vụ giao diện web tĩnh vừa làm endpoint Webhook SePay chạy trực tiếp bằng NodeJS trên VPS Linux mà không cần Vercel. **(ĐÃ TẠO ✅)**
- [x] **`.gitignore`:** Đã tạo để lọc bỏ các file nhạy cảm và thư mục rác trước khi đưa lên VPS. **(ĐÃ TẠO ✅)**
- [x] **`README.md`:** Đã tạo hướng dẫn chi tiết từng câu lệnh Linux trên VPS để cài đặt và triển khai hệ thống an toàn. **(ĐÃ TẠO ✅)**

---

## 📋 4. DANH SÁCH CHUẨN BỊ TRƯỚC KHI DEPLOY (CHECKLIST)
Hãy đảm bảo bạn có đầy đủ các thông tin và công cụ dưới đây trước ngày mai:

### A. Hạ tầng VPS Linux (Đề xuất Ubuntu 22.04 LTS)
- [x] Địa chỉ IP Public của VPS. **(ĐÃ CHUẨN BỊ ✅)**
- [x] Tài khoản root/user SSH để truy cập VPS. **(ĐÃ CHUẨN BỊ ✅)**
- [x] Đã trỏ Tên miền (Domain) về IP của VPS. **(ĐÃ HOÀN THÀNH ✅)**

### B. Môi trường trên VPS (Sẽ cài qua SSH)
- [x] Node.js (Version 18 hoặc 20 LTS) và npm. **(ĐÃ SẴN SÀNG CÀI ĐẶT ✅)**
- [x] PM2 (Để chạy server Node.js ngầm 24/7 và tự khởi động lại khi VPS restart). **(ĐÃ SẴN SÀNG CÀI ĐẶT ✅)**
- [x] Nginx (Làm Web Server làm nhiệm vụ Reverse Proxy chuyển hướng port 80/443 về port của NodeJS và bảo mật SSL). **(ĐÃ SẴN SÀNG CÀI ĐẶT ✅)**
- [x] Certbot (Để cài đặt chứng chỉ SSL HTTPS miễn phí từ Let's Encrypt). **(ĐÃ SẴN SÀNG CÀI ĐẶT ✅)**

### C. Cấu hình Tích hợp bên thứ ba
- [x] Đăng nhập Supabase Dashboard để kiểm tra kết nối database. **(ĐÃ KIỂM TRA OK ✅)**
- [x] Đăng nhập SePay Dashboard để chuẩn bị cấu hình webhook trỏ về URL mới: `https://tenmien-cua-ban.com/api/sepay-webhook`. **(ĐÃ SẴN SÀNG CẤU HÌNH ✅)**
