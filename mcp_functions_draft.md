# Danh Sách 3 Chức Năng MCP Chọn Lọc Để Quản Lý Qua Telegram

Tài liệu này tổng hợp 3 chức năng MCP cốt lõi được lựa chọn để xây dựng, giúp quản lý và vận hành hệ thống Nghệ Thuật Phong Thủy (Website, Supabase, SQLite `brain.db` và Resend Email) trực tiếp thông qua chat Telegram hàng ngày.

---

### 1. Lấy Báo Cáo Doanh Thu Và Đăng Ký Hàng Ngày
*   **Tên function:** `get_daily_report`
*   **Input params:** 
    *   `date` (string, định dạng `YYYY-MM-DD`, không bắt buộc - mặc định là ngày hôm nay)
*   **Output dự kiến:**
    *   Tổng số lượt đăng ký waitlist mới.
    *   Số lượng đơn hàng mới (thành công / đang chờ).
    *   Tổng doanh thu thu về (VND).
    *   So sánh tăng trưởng với ngày hôm trước (%).
*   **Tình huống dùng hàng ngày:** Sáng sớm thức dậy hoặc tối muộn hỏi bot để nắm bắt tức thời tình hình đăng ký tài liệu và doanh thu.
*   **Ví dụ câu nhắn Telegram sẽ trigger:**
    *   *"Báo cáo doanh thu hôm nay đi em"*
    *   *"Hôm nay tình hình thế nào rồi?"*
    *   *"Cho anh xem số liệu ngày hôm qua"*
    *   *"get_daily_report date=2026-05-19"*
*   **Độ ưu tiên:** 5/5

---

### 2. Truy Vấn Trạng Thái Khách Hàng Và Gửi Lại Email
*   **Tên function:** `manage_customer_email`
*   **Input params:**
    *   `email` (string, bắt buộc, email của khách hàng)
    *   `action` (string, bắt buộc, giá trị: `"status"` để kiểm tra, `"resend_email_1"`, `"resend_email_2"`, `"resend_email_3"`, `"resend_confirm"` để gửi lại mail)
*   **Output dự kiến:**
    *   *Nếu action là `"status"`:* Trả về Họ tên, SĐT, ngày đăng ký, danh sách các email đã được gửi tự động (Email 1/2/3), trạng thái đơn hàng (nếu có).
    *   *Nếu action là gửi lại email:* Trả về kết quả gửi lại thành công qua Resend (kèm ID email).
*   **Tình huống dùng hàng ngày:** Khi khách hàng nhắn tin phàn nàn chưa nhận được tài liệu hoặc xác nhận thanh toán, admin ra lệnh cho bot check và gửi lại tài liệu lập tức từ chat Telegram.
*   **Ví dụ câu nhắn Telegram sẽ trigger:**
    *   *"Kiểm tra email khachhang@gmail.com xem nhận được tài liệu chưa"*
    *   *"Gửi lại email 1 cho khách abc@gmail.com hộ anh"*
    *   *"Khách xyz@gmail.com báo chưa nhận được mail xác nhận mua hàng, gửi lại đi"*
    *   *"manage_customer_email email=test@gmail.com action=status"*
*   **Độ ưu tiên:** 5/5

---

### 3. Tạo Đơn Hàng Thủ Công (Manual Order)
*   **Tên function:** `create_manual_order`
*   **Input params:**
    *   `email` (string, bắt buộc, email khách hàng)
    *   `product_name` (string, bắt buộc, tên sản phẩm hoặc ID sản phẩm, ví dụ: `"Bộ tài liệu tự sửa lỗi nhà ở"`)
    *   `amount` (number, bắt buộc, số tiền thanh toán thực tế)
    *   `note` (string, không bắt buộc, lý do tạo đơn như: "Chuyển khoản tay qua zalo", "Tặng khách VIP")
*   **Output dự kiến:**
    *   Trạng thái tạo đơn thành công trên Supabase.
    *   Mã đơn hàng được sinh ra (dạng `NTPTXXXX`).
    *   Kết quả kích hoạt tự động gửi Email Xác nhận kèm tài liệu cho khách hàng.
*   **Tình huống dùng hàng ngày:** Khi khách hàng nhắn tin mua sản phẩm trực tiếp (không qua web) hoặc chuyển khoản thủ công không đúng cú pháp khiến webhook SePay không tự động kích hoạt được, admin ra lệnh cho bot tạo đơn để tự kích hoạt luồng gửi tài liệu.
*   **Ví dụ câu nhắn Telegram sẽ trigger:**
    *   *"Tạo đơn hàng cho khach@gmail.com mua bộ tự sửa lỗi nhà ở, số tiền 200000"*
    *   *"Tạo đơn thủ công: email=customer@example.com, sản phẩm=Phong thủy Bát Trạch, số tiền=150000, ghi chú=Khách chuyển khoản tay qua Zalo"*
    *   *"create_manual_order email=vip@gmail.com product_name=Tailieu amount=0 note=TangKhachVip"*
*   **Độ ưu tiên:** 4/5
