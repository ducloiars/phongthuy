---
name: tao-creative-fb
description: |
  What it does: Sản xuất full content gồm CẢ HÌNH ẢNH ĐẸP VÀ VĂN BẢN đi kèm (bài viết organic & ad copy) cho Facebook page và chiến dịch quảng cáo của Sếp Lợi. Bắt buộc mỗi bài đăng phải đi kèm cả hình ảnh và văn bản đi kèm.
  When to use it: Sử dụng khi cần tự động lên ý tưởng và đăng bài viết hàng ngày lên fanpage (Mode 1 - Content Free) hoặc khi cần tự động tạo 3 bộ quảng cáo khác nhau với 3 góc tiếp cận khác nhau để copy vào Ads Manager (Mode 2 - Creative Ads).
  
  Trigger phrases:
  - Mode 1: "tạo content cho ngày mai", "gen bài Page", "content free", "content organic"
  - Mode 2: "tạo creative ads", "gen ads", "cần creative cho chiến dịch"
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

Skill này hướng dẫn Claude sản xuất nội dung sáng tạo toàn diện gồm cả **HÌNH ẢNH và VĂN BẢN (CAPTION/AD COPY)**. Tuyệt đối không chỉ sinh ảnh hoặc chỉ sinh văn bản riêng rẽ.

---

## 🛠️ Yêu cầu Môi trường & Token (.env)
Đảm bảo file `.env` tại thư mục gốc của workspace hoặc tại thư mục `skills/tao-creative-fb/` có các biến sau:
*   `OPENAI_API_KEY`: API Key để gọi OpenAI Image & Chat Completion.
*   `FB_PAGE_ID`: ID của trang Facebook Page của Sếp Lợi.
*   `FB_PAGE_TOKEN`: Token Page có quyền đăng bài (`publish_to_groups`, `pages_manage_posts`, `pages_read_engagement`).
*   `DRY_RUN`: Đặt `true` để chạy thử nghiệm (in thông tin ra console, không đăng lên Facebook thật, lưu file text copy và ảnh cục bộ).

---

## 📖 Mode 1 — Content Free (Tự động đăng Page hàng ngày)

### Quy trình 4 bước tương tác:

1.  **Bước A: Lên ý tưởng (Ideation)**
    *   Khi người dùng trigger (ví dụ: *"tạo content cho ngày mai"*, *"content free"*), trợ lý tự lên **3 ý tưởng bài viết khác nhau**.
    *   Mỗi ý tưởng gồm: **[Tiêu đề ngắn] + [Góc tiếp cận / Angle]**.
    *   Hiển thị danh sách 3 ý tưởng và yêu cầu Sếp Lợi chọn 1 ý tưởng.

2.  **Bước B: Sản xuất nội dung (Production)**
    *   Khi Sếp chọn 1 ý tưởng (ví dụ: *"Chọn số 3"*), trợ lý thực hiện lần lượt theo thứ tự:
        *   **Bước B1 - Viết Caption trước:** Trợ lý chạy script python `skills/tao-creative-fb/scripts/gen_caption.py` để sinh caption hoặc tự sinh caption bám sát Brand Voice (tone điềm tĩnh, ngắt dòng cực ngắn 5-10 từ/dòng, sử dụng dấu ba chấm "…" và các emoji "🌿", "🙂", bắt buộc có các từ khóa: *biết ơn, đơn giản, cuộc đời, số mệnh*, tuyệt đối KHÔNG có CTA kêu gọi tải tài liệu hay mua khóa học).
        *   **Bước B2 - Trích xuất và phân tích câu Quote từ bài viết:** Chọn ra 1 câu cốt lõi/tâm đắc nhất trong Caption vừa viết ở trên (dài khoảng 10-25 từ) để làm chữ hiển thị trên ảnh. Phân tích câu Quote này thành các dòng (Line 1 đến Line 10) và chọn ra:
            *   **Chủ đề bài viết:** (Ví dụ: Tĩnh lặng, Biết ơn, Kiên trì, Trí tuệ...) để chọn mẫu hình nền tương ứng trong `assets/image-prompt-templates.md`.
            *   **Từ khóa chính 1:** Cụm từ quan trọng nhất ở phần đầu câu để đưa vào khung cọ quét xanh (Green brush stroke banner).
            *   **Từ khóa chính 2:** Cụm từ quan trọng ở phần cuối câu để đưa vào khung capsule cam (Orange capsule box).
        *   **Bước B3 - Sinh Hình Ảnh:** Chạy script Python bằng đường dẫn của skill (ví dụ: `python /app/data/skills-store/tao-creative-fb/5/scripts/gen_image.py --prompt "..." --quality low --model gpt-image-1 --output "organic_post.png"`). Trợ lý xây dựng prompt tỉ mỉ theo cấu trúc poster chữ nghệ thuật chuyên nghiệp với hình nền phù hợp, phông chữ chữ in hoa đậm, căn giữa, khung trang trí và chữ ký `"NTPT"` viết tay màu trắng ở góc dưới bên phải (tham khảo công thức và các mẫu hình nền trong `assets/image-prompt-templates.md`).
            *   *(Lưu ý: Bắt buộc dùng model gpt-image-1, chất lượng low cho tiết kiệm chi phí)*.

3.  **Bước C: Xem trước (Preview)**
    *   **Bắt buộc** hiển thị cho Sếp xem trước và gửi ảnh:
        *   Gọi ngay công cụ `send_file` với tham số `path` là `"organic_post.png"` và `caption` là nội dung Caption vừa viết ở Bước B1 để gửi trực tiếp tấm ảnh sang chat Telegram cho Sếp duyệt.
        *   Hiển thị cả nội dung Caption dạng text trong phản hồi chat.
    *   Hỏi Sếp: *"Sếp duyệt bài viết này để đăng lên Facebook Page chứ ạ?"*.

4.  **Bước D: Đăng bài (Publishing)**
    *   Khi Sếp đồng ý (ví dụ: *"OK", "Đăng đi", "Đăng bài đi", "oke đăng bài đi"*), chạy lệnh:
        *   `python /app/data/skills-store/tao-creative-fb/5/scripts/post_facebook.py --image "organic_post.png" --caption "[nội dung caption của Bước B1]"`
        *   *(Lưu ý: Nếu không đăng được do DRY_RUN=true trong env, hãy truyền inline `DRY_RUN=false` trước lệnh chạy ví dụ: `DRY_RUN=false python /app/data/skills-store/tao-creative-fb/5/scripts/post_facebook.py ...`)*
        *   Nếu thành công, thông báo ID ảnh / bài đăng. Nếu lỗi, báo cáo lỗi rõ ràng cho Sếp.

---

## 📢 Mode 2 — Creative Ads (Tạo tài nguyên chạy Ads, không tự đăng)

Khi Sếp trigger (ví dụ: *"tạo creative ads"*), trợ lý sản xuất ngay **3 bộ quảng cáo** khác nhau (Pain point / Solution / Social proof) mà không cần hỏi duyệt từng bước:

### Chi tiết 3 bộ Creative:
*   **Bộ 1 (Pain point):**
    *   Trợ lý viết Ad Copy (góc tiếp cận nỗi đau lận đận công việc/gia đạo).
    *   Chạy script sinh ảnh bằng đường dẫn tuyệt đối với prompt thiết kế chữ nghệ thuật theo công thức poster (phân tích từ khóa đau buồn/lận đận), nền phù hợp với nỗi đau (ví dụ: góc bàn làm việc tối tăm với ánh đèn leo lét, cửa sổ mưa rơi buồn bã) và bắt buộc có chữ ký `"NTPT"`.
    *   Chất lượng ảnh: model `gpt-image-1`, quality `medium`.
*   **Bộ 2 (Solution):**
    *   Trợ lý viết Ad Copy (góc tiếp cận giải pháp quay về tĩnh lặng và sửa mình).
    *   Chạy script sinh ảnh bằng đường dẫn tuyệt đối với prompt thiết kế chữ nghệ thuật theo công thức poster (nổi bật các từ khóa giải pháp), nền bình yên (ví dụ: góc vườn thiền đá và nước chảy róc rách) và bắt buộc có chữ ký `"NTPT"`.
    *   Chất lượng ảnh: model `gpt-image-1`, quality `medium`.
*   **Bộ 3 (Social proof):**
    *   Trợ lý viết Ad Copy (góc tiếp cận câu chuyện thành công, bình yên sau khi biết ơn).
    *   Chạy script sinh ảnh bằng đường dẫn tuyệt đối với prompt thiết kế chữ nghệ thuật theo công thức poster (nổi bật các từ khóa thành tựu/biến đổi), nền ấm áp tươi sáng (ví dụ: căn phòng ấm cúng ngập nắng mai) và bắt buộc có chữ ký `"NTPT"`.
    *   Chất lượng ảnh: model `gpt-image-1`, quality `medium`.

### Định dạng & Trả kết quả:
*   Các ảnh được lưu tại thư mục `output/` trong workspace.
*   Trợ lý hiển thị danh sách 3 bộ kèm theo đường dẫn ảnh đã lưu và nội dung ad copy để Sếp sao chép trực tiếp vào Ads Manager.
*   Tuyệt đối KHÔNG tự động đăng bài lên Facebook trong chế độ này.

---

## 🎨 Hướng dẫn Brand Voice khi Sinh Content
*   **Tone giọng:** Luôn luôn điềm tĩnh, gần gũi, chia sẻ sâu sắc như một người bạn đồng hành.
*   **Từ vựng bắt buộc dùng:** *biết ơn, đơn giản, cuộc đời, số mệnh*.
*   **Từ vựng cấm kỵ:** Tuyệt đối không dùng *vl, đcm* và các từ ngữ thô tục khác.
*   **Giao tiếp với Sếp Lợi:** Xưng "Tôi/Em", gọi "Sếp Lợi" hoặc "Anh Lợi", báo cáo điềm tĩnh, thực chất và chân thành.
