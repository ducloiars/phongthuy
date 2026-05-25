# Hướng Dẫn Viết Prompt Hình Ảnh & Các Mẫu Nền Đa Dạng

Tài liệu này định hình phong cách thiết kế chữ nghệ thuật (Typography) và các mẫu hình nền (Background) đa dạng của thương hiệu **"Nghệ Thuật Phong Thủy" (NTPT)**.

---

## 🎨 Nguyên tắc thiết kế chung:
1. **Chữ ký (Signature):** Bắt buộc phải có chữ ký `"NTPT"` viết bằng phông chữ viết tay màu trắng (calligraphy script) ở góc dưới cùng bên phải.
2. **Hình nền (Background):** Thay đổi linh hoạt và phù hợp với nội dung bài viết. Không sử dụng một hình nền cố định.
3. **Bố cục (Layout):** Chữ thiết kế nằm ở góc giữa hoặc góc trái, căn giữa các dòng, có các thành phần highlight rõ ràng.

---

## 📝 Công thức tạo Prompt thiết kế chữ (Typography Poster)

Khi gọi API tạo ảnh, prompt gửi đi phải tuân theo cấu trúc mô tả chi tiết dưới đây:

```text
A professional graphic design poster layout.
Background: [Đoạn mô tả hình nền phù hợp với bài viết - Chọn từ danh sách bên dưới hoặc tự sáng tạo tương tự].
Layout & Typography: Clean, centered, vertically aligned typography in the middle/left of the image. The text is written in Vietnamese with correct accents. Use the following exact lines and styles:
- Line 1: '[Dòng 1]' in bold dark brown sans-serif capital letters.
- Line 2: '[Từ khóa chính 1]' in white bold capital letters, centered inside a decorative horizontal green brush stroke banner background. There is a tiny green leaf twig ornament on the left and right of this line.
- Line 3: '— [Dòng 3 hoặc từ nối] —' in smaller dark brown capital letters with horizontal line accents.
- Line 4: '[Dòng 4 hoặc từ khóa phụ]' in orange-brown bold sans-serif capital letters, with a thin horizontal line and a tiny dot divider underneath.
- Line 5: '[Dòng 5]' in dark brown bold capital letters.
- Line 6: '[Từ khóa chính 2]' in dark olive green bold capital letters.
- Line 7: '— [Dòng 7 hoặc từ nối] —' in smaller dark brown capital letters.
- Line 8: '[Dòng 8]' in white bold capital letters, centered inside a horizontal rounded orange capsule box background.
- Line 9: '[Dòng 9]' in dark brown bold capital letters.
- Line 10: '[Dòng 10]' in dark olive green bold capital letters.
- Below the text: A small green leaf twig ornament divider.
- Signature (Bottom Right): 'NTPT' written in elegant, white cursive calligraphy script.
```

*Lưu ý: Nếu câu quote ngắn, số lượng Line có thể rút gọn (ví dụ còn 5-6 dòng) nhưng vẫn giữ nguyên nguyên tắc phối hợp khung cọ quét xanh (green brush stroke), khung capsule cam (orange capsule box) và chữ ký "NTPT".*

---

## 🌄 Các mẫu hình nền (Backgrounds) gợi ý theo chủ đề bài viết

Trợ lý cần phân tích chủ đề của bài viết ở Bước B2 để chọn/sáng tạo mô tả hình nền tương ứng:

### 1. Chủ đề: Tĩnh lặng, An yên, Buông bỏ, Số mệnh
> **Mô tả nền (Background Prompt):**
> `A serene and rustic morning scene with a warm ceramic mug of tea and a stack of three smooth zen stones on a wooden deck by a calm mountain lake at sunrise, soft warm lighting, relaxing atmosphere.`

### 2. Chủ đề: Biết ơn, Gia đình, Các mối quan hệ, Sống chậm
> **Mô tả nền (Background Prompt):**
> `A warm, cozy room with soft morning sunlight streaming through the window, a small green plant in a terracotta pot on a rustic wooden table next to an open book, cozy and peaceful vibe, soft focus.`

### 3. Chủ đề: Kiên trì, Vượt qua nghịch cảnh, Ý chí, Bản lĩnh
> **Mô tả nền (Background Prompt):**
> `A resilient green pine tree growing out of rocky cliffs under a dramatic morning sunrise with soft fog, majestic mountain peaks in the far distance, symbolic of strength, patience, and growth.`

### 4. Chủ đề: Sống đơn giản, Tự chiêm nghiệm, Thiền định
> **Mô tả nền (Background Prompt):**
> `A close-up of a tranquil outdoor zen stone garden, green moss on wet rocks, clean water gently dripping from a bamboo pipe into a stone bowl, soft afternoon light filtering through maple leaves, meditative and peaceful atmosphere.`

### 5. Chủ đề: Học hỏi, Phát triển bản thân, Trí tuệ
> **Mô tả nền (Background Prompt):**
> `A cozy personal library corner with bookshelves in soft focus, a warm light lamp illuminating a wooden desk, an open notebook and a cup of coffee on the desk, quiet and intellectual atmosphere, vintage color grading.`
