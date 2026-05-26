---
name: tao-video-ai
description: |
  What it does: Quy trình tự động hóa tạo video sản phẩm 15-25s từ ảnh sản phẩm bằng video AI (Higgsfield/Stream 4.5/Kling) hoặc local fallback render.
  When to use it: Sử dụng khi cần tạo video Reels, Shorts hoặc TikTok từ hình ảnh sản phẩm có sẵn.
trigger_phrases:
  - "tạo video AI"
  - "tao-video-ai"
  - "sinh video sản phẩm"
---

# Skill: Tự Động Tạo Video Sản Phẩm AI (tao-video-ai)

Skill này hướng dẫn quy trình tự động hóa sinh video quảng cáo sản phẩm thời trang cao cấp (Luxury fashion & Cinematic) từ hình ảnh có sẵn sử dụng các mô hình video AI (Higgsfield, Kling, Stream 4.5) kết hợp công cụ sinh prompt và biên tập tự động.

---

## 🛠️ Yêu Cầu Môi Trường & Biến (.env)
Đảm bảo file `.env` tại thư mục gốc của workspace chứa các thông tin sau:
*   `OPENAI_API_KEY`: Dùng để kết nối OpenAI API sinh prompt video chi tiết.
*   `HIGGSFIELD_API_KEY`: (Tùy chọn) Khai báo nếu có API Higgsfield thực tế.

---

## 📋 Quy Trình 7 Bước Tự Động Tạo Video (Workflow KP3/Higgsfield)

Khi nhận được yêu cầu từ Sếp (ví dụ: *"Tạo video AI cho váy lụa luxury"*, *"tạo video quảng cáo"*), thực hiện tuần tự 7 bước sau:

### 1. Bước 1: Tiếp nhận yêu cầu & Lên Ý tưởng
*   Xác định dòng sản phẩm và chủ đề (Topic) Sếp mong muốn.
*   Lựa chọn phong cách thiết kế: **KOC Fashion** (năng động trên TikTok) hoặc **Cinematic Detail-Shot** (cận cảnh sang trọng).

### 2. Bước 2: Liệt kê ảnh sản phẩm đầu vào
*   Chạy script Python để quét các ảnh sản phẩm mẫu trong thư mục `product-photos/`:
    ```bash
    python skills/tao-video-ai/scripts/list-images.py
    ```
*   Xác định danh sách ảnh làm tư liệu đầu vào (Image-to-Video).

### 3. Bước 3: Sinh Prompt Video cho từng Scene
*   Chạy script Python để sinh 4-5 prompt video chi tiết cho mô hình Stream 4.5/Higgsfield dựa trên topic và tư liệu ảnh đã liệt kê:
    ```bash
    python skills/tao-video-ai/scripts/gen-prompt.py --topic "Tên sản phẩm / Topic"
    ```
*   Script sẽ tạo ra file chứa các prompt tiếng Anh mô tả chi tiết chất liệu, ánh sáng, góc máy chuyển động (orbit, dolly in, pan slow...) kết hợp bộ negative prompt mặc định.

### 4. Bước 4: Trình duyệt Prompt (Preview & Approval)
*   Hiển thị danh sách các cảnh (scenes) kèm prompt tương ứng cho Sếp xem trước.
*   Hỏi ý kiến Sếp: *"Sếp duyệt bộ prompt này để em tiến hành sinh video nhé?"*

### 5. Bước 5: Chạy Sinh & Biên Tập Video (Upload / Compile)
*   Khi Sếp đồng ý, chạy lệnh để sinh và ghép nối các phân cảnh thành video hoàn chỉnh:
    ```bash
    python skills/tao-video-ai/scripts/upload-higgsfield.py --prompts-file "skills/tao-video-ai/output/prompts.json" --output "skills/tao-video-ai/output/final_video.mp4"
    ```
*   **Cơ chế hoạt động**:
    *   Nếu có `HIGGSFIELD_API_KEY` trong `.env`, gửi yêu cầu sinh video lên API thực tế của Higgsfield.
    *   Nếu không có, kích hoạt **Fallback Video Engine**: Sử dụng thư viện OpenCV trên Python để tự động vẽ hiệu ứng chuyển động camera ảo (zoom/pan), áp dụng chữ overlay cao cấp và xuất ra video `.mp4` hoàn chỉnh dài 15-25s mà không cần can thiệp tay. Đồng thời xuất hướng dẫn chi tiết từng bước để Sếp copy paste sang Higgsfield Web UI.

### 6. Bước 6: Xử lý lỗi (Troubleshoot)
*   Đọc tài liệu `references/troubleshoot.md` nếu video bị méo logo, sai màu sắc hoặc chi tiết áo bị biến dạng.
*   Tối ưu prompt hoặc thêm ảnh cận cảnh tương ứng theo hướng dẫn.

### 7. Bước 7: Bàn giao video hoàn chỉnh
*   Lưu file video kết quả tại `skills/tao-video-ai/output/final_video.mp4`.
*   Báo cáo đường dẫn file video cho Sếp kèm tóm tắt các cảnh quay.
