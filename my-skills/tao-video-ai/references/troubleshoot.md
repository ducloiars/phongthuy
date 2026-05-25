# AI Video Generation Troubleshooting Guide

Tài liệu đúc kết kinh nghiệm thực tế giải quyết các lỗi phổ biến khi sinh video bằng AI (Higgsfield, Kling, Luma, Runway).

## 1. Lỗi sai chi tiết sản phẩm (Wrong Details / Deformations)
*   **Hiện tượng**: Cúc áo biến dạng, khóa kéo mờ nhạt hoặc biến mất, đường may bị uốn lượn bất thường.
*   **Giải pháp**: 
    1. **Thêm ảnh cận cảnh (Close-up reference)**: Nạp thêm 1-2 bức ảnh chụp cực cận (macro shot) của chi tiết đó làm ảnh đầu vào (Image-to-Video).
    2. **Mô tả chi tiết trong prompt**: Khai báo rõ ràng cấu trúc chi tiết trong prompt (vĩ dụ: *"double-breasted brass buttons, straight silver zipper"*).
    3. **Tăng cường Negative Prompt**: Thêm cụm từ `deformed zipper, merged buttons, asymmetrical stitchings`.

## 2. Lỗi méo hoặc mất logo (Branding & Logo Distortion)
*   **Hiện tượng**: Logo của thương hiệu bị méo chữ, biến đổi thành chữ lạ hoặc mờ nhòe.
*   **Giải pháp**:
    1. **Sử dụng Kling 3.0 Element Pin**: Khi dùng Kling AI, sử dụng tính năng "Element Pin" (Ghim đối tượng) khoanh vùng logo sản phẩm gốc để giữ nguyên vẹn logo qua các frame.
    2. **Hạn chế xoay góc quá mạnh**: Tránh dùng prompt chuyển động camera quay 180 hoặc 360 độ quanh mặt có logo. Giữ camera ở góc trực diện hoặc xéo nhẹ (orbit dưới 30 độ).
    3. **Hậu kỳ (Post-processing)**: Nếu logo lệch nhẹ, dùng công cụ video editor đè mặt nạ (mask) hoặc tracker đè logo logo tĩnh chất lượng cao lên.

## 3. Lỗi nhấp nháy ánh sáng (Flickering / Light Shifting)
*   **Hiện tượng**: Ánh sáng đổi liên tục, nhấp nháy giữa các khung hình.
*   **Giải pháp**:
    1. **Khóa ánh sáng trong prompt**: Thêm các từ khóa cố định ánh sáng như `"consistent soft studio lighting, static shadows, steady exposure"`.
    2. **Sử dụng mô hình chuyển động chậm (slow motion)**: Chuyển động nhanh dễ gây lỗi nhấp nháy.
