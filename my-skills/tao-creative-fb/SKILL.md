---
name: tao-creative-fb
description: |
  Sản xuất full content (cả hình ảnh đẹp và văn bản đi kèm) cho Facebook Business Page và Chiến dịch Quảng cáo.
  Hỗ trợ 2 chế độ:
  1. MODE 1 — CONTENT FREE: Tạo bài viết organic hàng ngày, hỗ trợ đăng trực tiếp lên Facebook Page. Triggers: "tạo content cho ngày mai", "gen bài Page", "content free", "content organic".
  2. MODE 2 — CREATIVE ADS: Tạo 3 bộ quảng cáo khác nhau (Pain point / Solution / Social proof) để chạy ads. Triggers: "tạo creative ads", "gen ads", "cần creative cho chiến dịch".
trigger_phrases:
  - "tạo content cho ngày mai"
  - "gen bài Page"
  - "content free"
  - "content organic"
  - "tạo creative ads"
  - "gen ads"
  - "cần creative cho chiến dịch"
---

# Hướng dẫn Vận hành Trợ lý: tao-creative-fb

Skill này hướng dẫn Claude sản xuất nội dung sáng tạo toàn diện gồm cả **HÌNH ẢNH và VĂN BẢN**. Tuyệt đối không chỉ sinh ảnh hoặc chỉ sinh văn bản riêng rẽ.

---

## 🛠️ Yêu cầu Môi trường & Token (.env)
Đảm bảo file `.env` tại thư mục chứa scripts có các biến sau:
*   `OPENAI_API_KEY`: API Key để gọi OpenAI Image & Chat Completion.
*   `FB_PAGE_ID`: ID của trang Facebook Page của Sếp Lợi.
*   `FB_PAGE_TOKEN`: Token Page có quyền đăng bài (`publish_to_groups`, `pages_manage_posts`, `pages_read_engagement`).
*   `DRY_RUN`: Đặt `true` để chạy thử nghiệm (in thông tin ra console, không đăng lên Facebook thật).

---

## 📖 Mode 1 — Content Free (Tự động đăng Page hàng ngày)

### Quy trình 4 bước tương tác:

1.  **Bước A: Lên ý tưởng (Ideation)**
    *   Khi người dùng trigger (ví dụ: *"tạo content cho ngày mai"*), trợ lý chạy lệnh hoặc tự lên **3 ý tưởng bài viết khác nhau**.
    *   Mỗi ý tưởng gồm: **[Tiêu đề ngắn] + [Góc tiếp cận / Angle]**.
    *   Hiển thị danh sách 3 ý tưởng và yêu cầu Sếp Lợi chọn 1 ý tưởng.

2.  **Bước B: Sản xuất nội dung (Production)**
    *   Khi Sếp chọn 1 ý tưởng (ví dụ: *"Chọn số 2"*), trợ lý sẽ chạy lần lượt:
        *   `python scripts/gen_image.py --prompt "[prompt_tuong_ung]" --quality low` để sinh 1 ảnh đẹp 1024x1024 (lưu tại `temp_images/`).
        *   `python scripts/gen_caption.py --topic "[chu_de]" --mode organic` để sinh caption 80-150 từ theo phong cách **điềm tĩnh, gần gũi, biết ơn** từ `SOUL.md`.

3.  **Bước C: Xem trước (Preview)**
    *   Hiển thị cho Sếp xem trước:
        *   Đường dẫn ảnh local đã tạo.
        *   Đoạn caption đi kèm (có hook nhẹ, body chia sẻ sâu sắc và soft CTA tải tài liệu miễn phí).
    *   Hỏi Sếp: *"Sếp duyệt bài viết này để đăng lên Facebook Page chứ ạ?"*.

4.  **Bước D: Đăng bài (Publishing)**
    *   Khi Sếp đồng ý (ví dụ: *"OK", "Đăng đi"*), chạy lệnh:
        *   `python scripts/post_facebook.py --image "temp_images/[ten_anh].png" --caption "[caption_text]"`
        *   Nếu thành công, thông báo link bài viết hoặc ID ảnh. Nếu lỗi, báo cáo lỗi rõ ràng cho Sếp.

---

## 📢 Mode 2 — Creative Ads (Tạo tài nguyên chạy Ads, không tự đăng)

Khi Sếp trigger (ví dụ: *"tạo creative ads"*), trợ lý sản xuất ngay **3 bộ quảng cáo** khác nhau (Pain point / Solution / Social proof) mà không cần hỏi duyệt từng bước:

### Chi tiết 3 bộ Creative:
*   **Bộ 1 (Pain point):** Tập trung vào nỗi đau của khách hàng (lận đận công việc, gia đạo bất hòa do bố trí nhà cửa sai phong thủy).
*   **Bộ 2 (Solution):** Tập trung vào giải pháp đơn giản tự làm được (sắp xếp bàn làm việc, đổi hướng giường ngủ, tải tài liệu miễn phí tự sửa).
*   **Bộ 3 (Social proof):** Đưa ra các câu chuyện thành công, phản hồi từ những người đã tải tài liệu và tự cải thiện cuộc sống thành công.

### Mỗi bộ gồm cặp ghép đôi:
1.  **Ảnh quảng cáo:** Sinh bằng `scripts/gen_image.py` với `--quality medium`. Prompt cần chỉ định có khoảng trống để thiết kế text overlay.
2.  **Ad copy:** Sinh bằng `scripts/gen_caption.py` với `--mode ads`. Cấu trúc bài viết: Hook cực mạnh thu hút chú ý + Làm nổi bật USP của tài liệu/khóa học + Hard CTA rõ ràng thôi thúc bấm đăng ký.

Trợ lý hiển thị danh sách 3 bộ kèm theo đường dẫn ảnh và nội dung ad copy để Sếp sao chép trực tiếp vào Ads Manager.

---

## 🎨 Hướng dẫn Brand Voice khi Sinh Content
*   **Tone giọng:** Luôn luôn điềm tĩnh, gần gũi, chia sẻ sâu sắc như một người bạn đồng hành.
*   **Từ vựng bắt buộc dùng:** *biết ơn, đơn giản, cuộc đời, số mệnh*.
*   **Từ vựng cấm kỵ:** Tuyệt đối không dùng *vl, đcm* và các từ ngữ thô tục khác.
*   **Giao tiếp với Sếp Lợi:** Xưng "Tôi/Em", gọi "Sếp Lợi" hoặc "Anh Lợi", báo cáo điềm tĩnh, thực chất và chân thành.
