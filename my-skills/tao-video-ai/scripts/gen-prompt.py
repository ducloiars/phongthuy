#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import argparse
from dotenv import load_dotenv
from openai import OpenAI

# Cấu hình mã hóa UTF-8 cho dòng ra/dòng lỗi trên Windows để tránh UnicodeEncodeError
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Nạp file .env từ thư mục gốc của workspace
def load_workspace_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    env_path = os.path.join(workspace_dir, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()

def read_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

def get_fallback_storyboard(topic, images):
    print("[WARNING] Sử dụng Storyboard mẫu (fallback) do lỗi API hoặc thiếu OPENAI_API_KEY.")
    
    img_names = [img["name"] for img in images] if images else []
    img1 = img_names[0] if len(img_names) > 0 else "product_blue.png"
    img2 = img_names[1] if len(img_names) > 1 else "product_detail.png"
    img3 = img_names[2] if len(img_names) > 2 else "product_pink.png"
    img4 = img_names[3] if len(img_names) > 3 else "product_lifestyle1.png"

    return [
        {
            "scene": 1,
            "image": img1,
            "concept": "Giới thiệu sản phẩm với góc quay nghiêng sang trọng",
            "prompt": f"A luxury product video of {topic}, cinematic lighting, slow rotational orbit shot, shallow depth of field, subtle gold background reflections, 8k resolution, elegant look.",
            "negative_prompt": "ugly, deformed, low quality, bad lighting, watermark, signature.",
            "camera_motion": "orbit",
            "duration": 5
        },
        {
            "scene": 2,
            "image": img2,
            "concept": "Quay cận cảnh chất liệu vải lụa thêu tinh tế",
            "prompt": f"Extreme macro close-up of {topic} stitching and fabric texture, slow dolly-in shot, warm sunset glow, soft shadows, quiet luxury aesthetic.",
            "negative_prompt": "ugly, deformed, low quality, bad lighting, watermark, signature.",
            "camera_motion": "dolly-in",
            "duration": 5
        },
        {
            "scene": 3,
            "image": img3,
            "concept": "Chuyển động lướt ngang sản phẩm lấp lánh",
            "prompt": f"Slow panning shot of {topic} lying elegant, light leak overlay, champagne gold palette, premium studio lighting, elegant pacing.",
            "negative_prompt": "ugly, deformed, low quality, bad lighting, watermark, signature.",
            "camera_motion": "pan-slow",
            "duration": 5
        },
        {
            "scene": 4,
            "image": img4,
            "concept": "Người mẫu diện váy trong không gian hoàng hôn luxury",
            "prompt": f"High fashion editorial view of a model wearing {topic}, key zoom with rack focus, luxury resort background, 120fps feel, Vogue style.",
            "negative_prompt": "ugly, deformed, low quality, bad lighting, watermark, signature.",
            "camera_motion": "key-zoom",
            "duration": 5
        }
    ]

def main():
    parser = argparse.ArgumentParser(description="Sinh video prompt cho Stream 4.5/Higgsfield từ topic.")
    parser.add_argument("--topic", type=str, required=True, help="Chủ đề váy/sản phẩm cần tạo video.")
    args = parser.parse_args()

    load_workspace_env()
    openai_key = os.getenv("OPENAI_API_KEY")

    # Đường dẫn các file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    skill_dir = os.path.dirname(script_dir)
    workspace_dir = os.path.dirname(skill_dir)
    
    brand_style_path = os.path.join(skill_dir, "assets", "brand-style.md")
    camera_prompts_path = os.path.join(skill_dir, "assets", "camera-prompts.md")
    negative_prompt_path = os.path.join(skill_dir, "assets", "negative-prompt.txt")

    brand_style = read_file_content(brand_style_path)
    camera_prompts = read_file_content(camera_prompts_path)
    negative_prompt_default = read_file_content(negative_prompt_path)

    # Đọc danh sách ảnh sản phẩm hiện tại bằng list-images.py
    sys.path.append(script_dir)
    try:
        from list_images import list_product_images
        images = list_product_images()
    except Exception:
        images = []

    # Tạo thư mục output nếu chưa có
    output_dir = os.path.join(skill_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    storyboard = None

    if not openai_key or openai_key.startswith("sk-proj-YOUR"):
        storyboard = get_fallback_storyboard(args.topic, images)
    else:
        try:
            client = OpenAI(api_key=openai_key)
            
            img_list_str = "\n".join([f"- {img['name']}" for img in images]) if images else "Không có ảnh mẫu"
            
            prompt_user = f"""
Hãy thiết kế một kịch bản phân cảnh quảng cáo dạng Storyboard gồm 4 scene (mỗi scene 4-5s, tổng độ dài 15-20s) cho sản phẩm thời trang cao cấp với chủ đề: "{args.topic}".

Dưới đây là danh sách ảnh sản phẩm có sẵn:
{img_list_str}

Hãy kết hợp các tài liệu phong cách sau để sinh prompt:
---
[BRAND STYLE (luxury)]:
{brand_style}

[CAMERA MOTION PROMPTS]:
{camera_prompts}

[NEGATIVE PROMPT MẶC ĐỊNH]:
{negative_prompt_default}
---

Hãy trả về kết quả dưới dạng một mảng JSON thuần túy (RAW JSON ARRAY) chứa các đối tượng có cấu trúc sau, tuyệt đối không viết thêm lời dẫn hay block markdown ngoài JSON.

Cấu trúc mỗi scene cần có các trường:
- "scene": số thứ tự scene (từ 1 đến 4).
- "image": tên file ảnh sản phẩm phù hợp nhất được chọn từ danh sách ở trên (ví dụ: product_blue.png). Nếu không có ảnh nào, dùng giá trị mặc định "product_blue.png".
- "concept": mô tả ngắn bằng tiếng Việt về ý tưởng cảnh quay.
- "prompt": câu prompt tiếng Anh chi tiết cho Higgsfield / Stream 4.5. Phải bao gồm mô tả sản phẩm, chuyển động camera chuẩn từ CAMERA MOTION, ánh sáng, chất liệu lụa/da sang trọng và tone màu luxury.
- "negative_prompt": câu negative prompt thích hợp (dựa trên negative-prompt.txt).
- "camera_motion": tên loại chuyển động (một trong các giá trị: orbit, dolly-in, pan-slow, key-zoom, multishot).
- "duration": thời lượng của phân cảnh bằng giây (4 hoặc 5).

Ví dụ định dạng trả về:
[
  {{
    "scene": 1,
    "image": "product_blue.png",
    "concept": "Mô tả...",
    "prompt": "English prompt...",
    "negative_prompt": "Negative prompt...",
    "camera_motion": "orbit",
    "duration": 5
  }}
]
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional creative director for luxury fashion brands (Vogue/Chanel aesthetic). You only respond with valid JSON arrays."},
                    {"role": "user", "content": prompt_user}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            data = json.loads(content)
            if isinstance(data, dict):
                for key in ["storyboard", "scenes", "data", "list"]:
                    if key in data:
                        data = data[key]
                        break
            
            if isinstance(data, list):
                storyboard = data
            else:
                storyboard = get_fallback_storyboard(args.topic, images)
                
        except Exception as e:
            print(f"[ERROR] Lỗi gọi OpenAI API: {e}", file=sys.stderr)
            storyboard = get_fallback_storyboard(args.topic, images)

    # Lưu storyboard ra file json trong thư mục output
    output_file = os.path.join(output_dir, "prompts.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(storyboard, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] Đã sinh và lưu storyboard tại: {output_file}")
    print(json.dumps(storyboard, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
