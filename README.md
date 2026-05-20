# HƯỚNG DẪN DEPLOY WEBSITE NGHỆ THUẬT PHONG THỦY LÊN VPS LINUX

Tài liệu này hướng dẫn chi tiết từng bước để triển khai toàn bộ mã nguồn website tĩnh cùng với hệ thống Webhook tự động nhận diện thanh toán SePay lên một VPS chạy hệ điều hành Linux (khuyên dùng **Ubuntu 20.04** hoặc **22.04 LTS**).

---

## 🏗️ 1. KIẾN TRÚC TRIỂN KHAI TRÊN VPS
Hệ thống sử dụng **Node.js + Express** để chạy dưới dạng máy chủ kết hợp:
* **Frontend Static Serving:** Tự động phục vụ tất cả các trang giao diện (.html, .css, .js) từ thư mục gốc.
* **Backend Endpoint:** Tiếp nhận và xử lý các cuộc gọi Webhook từ SePay tại địa chỉ `/api/sepay-webhook` để tự động cập nhật trạng thái đơn hàng trong database Supabase.
* **Quản lý tiến trình (PM2):** Giúp server luôn chạy ngầm 24/7 và tự khởi chạy lại nếu VPS bị tắt nguồn.
* **Nginx Reverse Proxy:** Nhận các request từ cổng tiêu chuẩn `80` (HTTP) hoặc `443` (HTTPS) rồi chuyển tiếp vào cổng chạy server Node.js (mặc định là `3000`), đồng thời xử lý chứng chỉ bảo mật SSL (HTTPS).

---

## 🛠️ 2. CÁC BƯỚC THỰC HIỆN TRÊN VPS LINUX

### BƯỚC 1: Cài đặt NodeJS, NPM và PM2 trên VPS
Sau khi đăng nhập SSH vào VPS bằng Terminal (hoặc MobaXterm/PuTTY):
```bash
# Cập nhật danh sách các package
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js phiên bản LTS (dùng Node Source)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra phiên bản đã cài đặt
node -v
npm -v

# Cài đặt PM2 để quản lý tiến trình chạy ngầm
sudo npm install pm2 -g
```

### BƯỚC 2: Tải Source Code lên VPS
Bạn có thể kéo source code từ Github bằng lệnh `git clone`, hoặc dùng phần mềm FTP (như FileZilla / WinSCP) để upload trực tiếp toàn bộ thư mục dự án lên thư mục `/var/www/phongthuy` trên VPS.
*(Lưu ý: Không copy thư mục `node_modules` từ máy cá nhân lên VPS).*

### BƯỚC 3: Cài đặt Dependencies & Cấu hình môi trường
Truy cập vào thư mục chứa code trên VPS và chạy lệnh:
```bash
cd /var/www/phongthuy

# Cài đặt các package cần thiết
npm install

# Tạo file .env và cấu hình (Sử dụng trình soạn thảo nano)
nano .env
```
Copy và paste các thông tin cấu hình Supabase của bạn vào file `.env` (Bấm `Ctrl + O` -> `Enter` để lưu, và `Ctrl + X` để thoát):
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### BƯỚC 4: Khởi chạy Server Node.js bằng PM2
```bash
# Khởi chạy server và đặt tên tiến trình là "phongthuy-web"
pm2 start server.js --name "phongthuy-web"

# Cấu hình tự động khởi động server khi VPS restart
pm2 startup
pm2 save
```
Các lệnh quản lý PM2 cơ bản:
* `pm2 status`: Xem trạng thái các ứng dụng đang chạy.
* `pm2 logs`: Xem log thời gian thực của server.
* `pm2 restart phongthuy-web`: Khởi động lại server.

### BƯỚC 5: Cấu hình Nginx làm Reverse Proxy và Cài SSL (HTTPS)
Để trỏ tên miền của bạn về cổng `3000` của Node.js:

```bash
# Cài đặt Nginx
sudo apt install nginx -y

# Mở cấu hình trang web mới
sudo nano /etc/nginx/sites-available/default
```
Thay thế nội dung file cấu hình bằng cấu hình Reverse Proxy dưới đây (thay `domain_cua_ban.com` bằng tên miền thật của bạn):
```nginx
server {
    listen 80;
    server_name domain_cua_ban.com www.domain_cua_ban.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Lưu lại và kiểm tra cấu hình Nginx, sau đó restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Cài đặt SSL HTTPS miễn phí (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain_cua_ban.com -d www.domain_cua_ban.com
```
Nhập email và đồng ý với các điều khoản, chọn cấu hình tự động redirect từ HTTP sang HTTPS.

---

## 🎯 3. CẤU HÌNH WEBHOOK TRÊN SEPAY
1. Truy cập vào tài khoản SePay của bạn tại [SePay Dashboard](https://my.sepay.vn).
2. Vào mục **Cấu hình Webhook** -> **Thêm mới**.
3. Điền địa chỉ URL Webhook mới của bạn:
   `https://domain_cua_ban.com/api/sepay-webhook`
4. Chọn phương thức gửi là **POST**, kiểu dữ liệu **JSON**.
5. Nhấp **Lưu cấu hình** và tiến hành kiểm tra kết nối thử nghiệm.
