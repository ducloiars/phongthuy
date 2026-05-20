# Máy chủ MCP Phong Thủy (Streamable HTTP Transport)

Máy chủ này triển khai giao thức Model Context Protocol (MCP) của Anthropic để AI Agent có thể truy cập dữ liệu và thực hiện một số thao tác nghiệp vụ thiết yếu qua Telegram/HTTP.

Máy chủ chạy tại cổng `3001` và chỉ bind vào `127.0.0.1` (localhost) vì lý do bảo mật. Mọi yêu cầu gọi tool được điều hướng nội bộ từ client (như goClaw).

---

## 🛠️ Danh sách các công cụ (Tools) cung cấp

1. **`get_daily_report`**: Lấy báo cáo số lượt đăng ký waitlist mới, đơn hàng thành công và tổng doanh thu trong ngày (mặc định hôm nay, hoặc truyền ngày dạng `YYYY-MM-DD`).
2. **`manage_customer_email`**: Tra cứu trạng thái gửi chuỗi email marketing của khách hàng (`action: "status"`) hoặc kích hoạt gửi lại email tự động cụ thể (`action: "resend_email_1|2|3"` hoặc `"resend_confirm"`).
3. **`create_manual_order`**: Tạo đơn hàng thủ công với trạng thái `success` trên Supabase cho khách hàng và tự động kích hoạt luồng gửi Email xác nhận kèm link tài liệu qua Resend.

---

## 🚀 Hướng dẫn Cài đặt & Triển khai trên VPS

### 1. Chuẩn bị thư mục và cài đặt thư viện
Tại VPS của bạn, di chuyển vào thư mục `/opt/my-website/mcp` (hoặc thư mục tương tự chứa mã nguồn dự án) và chạy lệnh cài đặt:
```bash
cd /opt/my-website/mcp
npm install
```

### 2. Thiết lập cấu hình môi trường
Máy chủ MCP tự động đọc file cấu hình `.env` ở thư mục cha (`../.env`). Đảm bảo file `.env` đó chứa đầy đủ các biến môi trường sau:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_resend_api_key
```

### 3. Cấu hình Chạy nền bằng Systemd (Khuyên dùng)
Tạo một file service systemd để chạy nền và tự động khởi động lại MCP server khi VPS reboot.

Tạo file: `/etc/systemd/system/phongthuy-mcp.service`
```ini
[Unit]
Description=Phong Thuy MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/my-website/mcp
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

*Lưu ý: Thay đổi đường dẫn `/opt/my-website/mcp` và `/usr/bin/node` cho đúng với cấu hình VPS của bạn (có thể tìm đường dẫn node bằng lệnh `which node`).*

**Kích hoạt và khởi chạy dịch vụ:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable phongthuy-mcp
sudo systemctl start phongthuy-mcp
sudo systemctl status phongthuy-mcp
```

### 4. Quản lý bằng PM2 (Phương án thay thế)
Nếu bạn thích dùng PM2 hơn Systemd, bạn có thể chạy:
```bash
cd /opt/my-website/mcp
pm2 start index.js --name "phongthuy-mcp"
pm2 save
pm2 startup
```

---

## 🧪 Hướng dẫn Kiểm tra cục bộ (Testing)

Vì server chỉ bind vào `127.0.0.1:3001` nên bạn cần ssh vào VPS (hoặc test trực tiếp trên máy đang chạy server) để gọi `curl`.

### Khởi tạo Session MCP
MCP sử dụng Streamable HTTP yêu cầu khởi tạo session trước để lấy `mcp-session-id`.

```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```
Kết quả trả về sẽ có header `mcp-session-id` (hoặc trong cookie/data). Hãy copy `mcp-session-id` này để gửi trong các request tiếp theo.

### Gọi các công cụ (Tools)

Sau khi có `mcp-session-id` (ví dụ: `xxxx-xxxx-xxxx-xxxx`), bạn gọi tool bằng phương thức `tools/call`:

#### 1. Gọi `get_daily_report`
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: xxxx-xxxx-xxxx-xxxx" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_daily_report",
      "arguments": {
        "date": "2026-05-20"
      }
    }
  }'
```

#### 2. Gọi `manage_customer_email` (Kiểm tra trạng thái)
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: xxxx-xxxx-xxxx-xxxx" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "manage_customer_email",
      "arguments": {
        "email": "test@gmail.com",
        "action": "status"
      }
    }
  }'
```

#### 3. Gọi `create_manual_order`
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: xxxx-xxxx-xxxx-xxxx" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "create_manual_order",
      "arguments": {
        "email": "test@gmail.com",
        "product_name": "Gương Bát Quái Gỗ Đào",
        "amount": 450000,
        "note": "Khách chuyển khoản tay qua Zalo"
      }
    }
  }'
```
