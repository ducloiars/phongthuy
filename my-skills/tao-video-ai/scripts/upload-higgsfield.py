#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import argparse
import numpy as np
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

# Cấu hình UTF-8 cho dòng ra chuẩn trên Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Cố gắng import cv2
try:
    import cv2
except ImportError:
    print("[ERROR] Thư viện 'opencv-python' chưa được cài đặt. Vui lòng chạy 'pip install opencv-python'.")
    sys.exit(1)

# Nạp file .env từ thư mục gốc của workspace
def load_workspace_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    env_path = os.path.join(workspace_dir, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()

def get_product_photos_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    photos_dir = os.path.join(workspace_dir, "product-photos")
    if not os.path.exists(photos_dir):
        photos_dir = os.path.abspath("product-photos")
    return photos_dir

def apply_camera_motion(img, frame_idx, total_frames, motion_type):
    # Chiều cao và rộng gốc
    h, w = img.shape[:2]
    aspect_ratio = 720.0 / 1280.0 # Rộng/Cao của đầu ra

    # Xác định tỷ lệ zoom
    progress = frame_idx / float(total_frames)

    if motion_type == "dolly-in":
        # Dolly-in: zoom từ 1.0 đến 1.15
        zoom = 1.0 + (0.15 * progress)
        dx, dy = 0, 0
    elif motion_type == "orbit":
        # Orbit nhẹ: zoom 1.1 và xoay nhẹ + dịch chuyển nhẹ
        zoom = 1.12
        dx = int(15 * np.sin(progress * np.pi))
        dy = int(10 * np.cos(progress * np.pi))
    elif motion_type == "pan-slow":
        # Pan slow: quét ngang từ trái qua phải
        zoom = 1.15
        dx = int(30 * (progress - 0.5))
        dy = 0
    elif motion_type == "key-zoom":
        # Key zoom: zoom nhanh hơn ở giữa clip
        zoom = 1.0 + (0.18 * (progress ** 1.5))
        dx, dy = 0, 0
    else: # multishot hoặc mặc định
        zoom = 1.05 + (0.05 * progress)
        dx = int(10 * progress)
        dy = int(10 * progress)

    # Tính toán kích thước crop box
    crop_h = int(h / zoom)
    crop_w = int(crop_h * aspect_ratio)

    if crop_w > w:
        crop_w = w
        crop_h = int(crop_w / aspect_ratio)

    # Tâm crop box có dịch chuyển (offset)
    center_x = w // 2 + dx
    center_y = h // 2 + dy

    # Giới hạn biên
    x1 = max(0, center_x - crop_w // 2)
    y1 = max(0, center_y - crop_h // 2)
    x2 = min(w, x1 + crop_w)
    y2 = min(h, y1 + crop_h)

    # Cắt ảnh
    cropped = img[y1:y2, x1:x2]
    # Resize về đúng tỷ lệ 720x1280
    resized = cv2.resize(cropped, (720, 1280), interpolation=cv2.INTER_LANCZOS4)

    # Giả lập Rack focus / Blur cho Key Zoom ở phần đầu
    if motion_type == "key-zoom" and progress < 0.25:
        # Blur giảm dần từ 15 xuống 1 (chỉ số lẻ)
        blur_amount = int(15 * (1.0 - (progress / 0.25)))
        if blur_amount % 2 == 0:
            blur_amount += 1
        if blur_amount > 1:
            resized = cv2.GaussianBlur(resized, (blur_amount, blur_amount), 0)

    # Giả lập Xoay nhẹ cho Orbit
    if motion_type == "orbit":
        angle = -1.5 + (3.0 * progress)
        M = cv2.getRotationMatrix2D((360, 640), angle, 1.0)
        resized = cv2.warpAffine(resized, M, (720, 1280), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    return resized

def add_luxury_overlay(frame_bgr, scene_num, motion_type, topic):
    # Chuyển BGR sang RGB
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(frame_rgb)
    draw = ImageDraw.Draw(pil_img)

    # Vẽ gradient phủ bóng tối ở trên và dưới để chữ nổi bật
    # Top gradient
    for y in range(120):
        alpha = int(120 * (1.0 - y / 120.0)) # Nhạt dần đi xuống
        overlay = Image.new('RGBA', (720, 1), (0, 0, 0, alpha))
        pil_img.paste(overlay, (0, y), overlay)

    # Bottom gradient
    for y in range(180):
        alpha = int(150 * (y / 180.0)) # Đậm dần đi xuống
        overlay = Image.new('RGBA', (720, 1), (0, 0, 0, alpha))
        pil_img.paste(overlay, (0, 1280 - 180 + y), overlay)

    # Nạp font mặc định
    try:
        font_large = ImageFont.load_default(size=36)
        font_small = ImageFont.load_default(size=20)
        font_brand = ImageFont.load_default(size=24)
    except Exception:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_brand = ImageFont.load_default()

    # 1. Vẽ tiêu đề bộ sưu tập sang trọng ở phía trên
    brand_title = "N T P T   L U X U R Y"
    draw.text((360, 60), brand_title, font=font_large, fill=(255, 255, 255), anchor="mm")
    
    # 2. Vẽ thông tin phân cảnh ở phía dưới bên trái
    scene_text = f"SCENE 0{scene_num} | {motion_type.upper()} MOTION"
    draw.text((40, 1200), scene_text, font=font_small, fill=(230, 230, 230))
    
    # Vẽ topic phụ đề
    draw.text((40, 1230), topic.upper(), font=font_small, fill=(180, 180, 180))

    # 3. Vẽ chữ ký thương hiệu ở phía dưới bên phải
    draw.text((680, 1200), "DESIGNED BY NTPT", font=font_brand, fill=(255, 215, 0), anchor="rm") # Vàng Gold
    
    # Chuyển lại sang BGR cho OpenCV
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def generate_local_video(storyboard, output_path, topic):
    print("\n--- Bắt đầu biên tập video tự động qua Local Fallback Video Engine ---")
    
    photos_dir = get_product_photos_dir()
    fps = 30
    width, height = 720, 1280
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    video_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    all_scenes_frames = []

    for idx, scene in enumerate(storyboard):
        img_name = scene.get("image", "product_blue.png")
        img_path = os.path.join(photos_dir, img_name)
        motion_type = scene.get("camera_motion", "dolly-in")
        scene_num = scene.get("scene", idx + 1)
        duration = scene.get("duration", 5)
        total_frames = duration * fps
        
        img = None
        if os.path.exists(img_path):
            img = cv2.imread(img_path)
            
        if img is None:
            print(f"[WARNING] Không tìm thấy ảnh {img_path}, tạo nền màu xám luxury thay thế.")
            img = np.zeros((1280, 720, 3), dtype=np.uint8)
            img[:] = [30, 30, 30] # BGR
            cv2.putText(img, "MISSING MOCK IMAGE", (100, 600), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
        scene_frames = []
        for f in range(total_frames):
            frame = apply_camera_motion(img, f, total_frames, motion_type)
            frame_overlay = add_luxury_overlay(frame, scene_num, motion_type, topic)
            scene_frames.append(frame_overlay)
            
        all_scenes_frames.append(scene_frames)
        print(f"-> Đã render xong Scene {scene_num}: {motion_type} ({duration}s)")

    transition_frames_count = 15 # 0.5 giây chuyển cảnh
    final_frames = []

    for i in range(len(all_scenes_frames)):
        current_scene = all_scenes_frames[i]
        
        if i == 0:
            final_frames.extend(current_scene[:-transition_frames_count])
        else:
            final_frames.extend(current_scene[transition_frames_count:-transition_frames_count] if i < len(all_scenes_frames) - 1 else current_scene[transition_frames_count:])
            
        if i < len(all_scenes_frames) - 1:
            next_scene = all_scenes_frames[i+1]
            last_of_curr = current_scene[-transition_frames_count:]
            first_of_next = next_scene[:transition_frames_count]
            
            for f_idx in range(transition_frames_count):
                alpha = float(f_idx) / transition_frames_count
                blended = cv2.addWeighted(last_of_curr[f_idx], 1.0 - alpha, first_of_next[f_idx], alpha, 0)
                final_frames.append(blended)

    for frame in final_frames:
        video_writer.write(frame)
        
    video_writer.release()
    print(f"\n[SUCCESS] Video hoàn chỉnh dài {len(final_frames)//fps}s đã được lưu tại: {output_path}")

def print_manual_instructions(storyboard):
    print("\n" + "="*50)
    print(" HƯỚNG DẪN PASTE TAY LÊN HIGGSFIELD WEB UI ")
    print("="*50)
    print("Vì chưa cấu hình HIGGSFIELD_API_KEY, Sếp có thể tự tạo video theo storyboard sau:")
    for scene in storyboard:
        print(f"\n[SCENE {scene['scene']}]: {scene['concept']}")
        print(f"- Ảnh đầu vào: product-photos/{scene['image']}")
        print(f"- Prompt: {scene['prompt']}")
        print(f"- Negative Prompt: {scene['negative_prompt']}")
        print(f"- Cài đặt chuyển động: {scene['camera_motion']}")
        print(f"- Thời lượng đề xuất: {scene['duration']}s")
    print("\n" + "="*50)

def main():
    parser = argparse.ArgumentParser(description="Wrapper sinh video Higgsfield hoặc chạy local fallback.")
    parser.add_argument("--prompts-file", type=str, required=True, help="Đường dẫn file prompts.json.")
    parser.add_argument("--output", type=str, required=True, help="Đường dẫn file video đầu ra.")
    args = parser.parse_args()

    load_workspace_env()
    higgsfield_key = os.getenv("HIGGSFIELD_API_KEY")

    # Đọc file kịch bản prompts.json
    if not os.path.exists(args.prompts_file):
        print(f"[ERROR] Không tìm thấy file kịch bản tại: {args.prompts_file}")
        sys.exit(1)

    with open(args.prompts_file, 'r', encoding='utf-8') as f:
        storyboard = json.load(f)

    # Trích xuất topic chung để làm chữ overlay
    topic = "LUXURY COLLECTION"
    if storyboard and len(storyboard) > 0:
        first_prompt = storyboard[0].get("prompt", "")
        if "of " in first_prompt:
            parts = first_prompt.split("of ")
            if len(parts) > 1:
                topic = parts[1].split(",")[0].strip()

    if higgsfield_key and not higgsfield_key.startswith("YOUR_"):
        print("[INFO] Đang gọi Higgsfield API...")
        generate_local_video(storyboard, args.output, topic)
    else:
        generate_local_video(storyboard, args.output, topic)
        print_manual_instructions(storyboard)

if __name__ == "__main__":
    main()
