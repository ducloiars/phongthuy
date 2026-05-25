#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import random
import re
import subprocess
from dotenv import load_dotenv

# Cấu hình UTF-8 cho Windows
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

def get_workspace_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))

def parse_plan_topics(plan_path):
    topics = []
    if not os.path.exists(plan_path):
        return topics
        
    try:
        with open(plan_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
            
        # Tìm các dòng chứa chủ đề trong file markdown
        # Hỗ trợ cả lỗi hiển thị mã hóa chữ "Chủ đề" dạng "Ch  `?:" hoặc tương tự
        lines = content.split('\n')
        for line in lines:
            line_strip = line.strip()
            # Regex quét "Chủ đề" hoặc lỗi mã hóa "Ch...?: "
            if re.search(r'(Chủ\s+đề|Ch\S+\s+\S+\?:|Ch\S+\S+\?:)', line_strip, re.IGNORECASE):
                # Lấy phần sau dấu hai chấm
                parts = line_strip.split(':', 1)
                if len(parts) > 1:
                    topic_text = parts[1].strip()
                    # Loại bỏ các dấu markdown như **, *
                    topic_text = re.sub(r'[\*\#\_]', '', topic_text).strip()
                    if topic_text and len(topic_text) > 5:
                        topics.append(topic_text)
    except Exception as e:
        print(f"[WARNING] Lỗi đọc plan.md: {e}", file=sys.stderr)
        
    return topics

def get_unused_topic(topics, history_path):
    posted_topics = set()
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r', encoding='utf-8') as f:
                for line in f:
                    t = line.strip()
                    if t:
                        posted_topics.add(t)
        except Exception:
            pass
            
    for t in topics:
        if t not in posted_topics:
            return t
            
    # Nếu dùng hết hoặc không quét được, trả về chủ đề mặc định hoặc ngẫu nhiên
    fallback_topics = [
        "Váy Lụa Sát Nách Quiet Luxury thiết kế tối giản sang trọng",
        "Sắp xếp góc làm việc chuẩn phong thủy giúp tăng năng lượng tích cực",
        "Lựa chọn màu sắc trang phục phù hợp với bản mệnh để thu hút may mắn",
        "Thanh tẩy không gian phòng ngủ mang lại giấc ngủ bình an",
        "Nghệ thuật ứng xử nhã nhặn giúp gắn kết tình cảm gia đình"
    ]
    for ft in fallback_topics:
        if ft not in posted_topics:
            return ft
            
    return random.choice(fallback_topics)

def save_to_history(topic, history_path):
    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(topic + "\n")
    except Exception as e:
        print(f"[WARNING] Lỗi lưu lịch sử chủ đề: {e}", file=sys.stderr)

def generate_brand_caption(topic):
    # Tự động sinh Caption bám sát Brand Voice: ngắt dòng ngắn, có các từ khóa bắt buộc
    keywords = ["biết ơn", "đơn giản", "cuộc đời", "số mệnh"]
    caption_template = f"""Mỗi sự xoay vần trong {topic.lower()}...
đều mang một thông điệp riêng...
🌿
Khi ta biết đối diện...
bằng lòng biết ơn sâu sắc...
ta sẽ thấy mọi khó khăn...
chỉ là phép thử của cuộc đời...
🙂
Khi suy nghĩ đơn giản đi...
mọi bão giông sẽ hóa dịu dàng...
số mệnh nằm trong tay ta...
hãy sửa mình để đón nhận bình an...
🌿
#suyngam #songtinhte #reels #shorts #tiktok"""
    return caption_template

def main():
    load_workspace_env()
    workspace_dir = get_workspace_dir()
    
    plan_path = os.path.join(workspace_dir, "plan.md")
    history_path = os.path.join(workspace_dir, "skills", "tao-creative-fb", "output", "posted_topics.txt")
    
    # Tạo thư mục output của skill nếu chưa có
    os.makedirs(os.path.dirname(history_path), exist_ok=True)

    print("Bước 1: Đọc Content Plan và tìm chủ đề phù hợp...")
    topics = parse_plan_topics(plan_path)
    print(f"-> Quét được {len(topics)} chủ đề từ plan.md.")
    
    topic = get_unused_topic(topics, history_path)
    print(f"-> Chọn chủ đề video hôm nay: \"{topic}\"")
    
    # Gọi skill tao-video-ai để tạo video
    print("\nBước 2: Gọi Skill 'tao-video-ai' để thiết kế storyboard và sinh video...")
    
    # 1. Chạy gen-prompt.py
    script_gen_prompt = os.path.join(workspace_dir, "skills", "tao-video-ai", "scripts", "gen-prompt.py")
    print(f"-> Đang chạy gen-prompt.py cho topic: {topic}")
    p_gen = subprocess.run([
        sys.executable, script_gen_prompt, "--topic", topic
    ], capture_output=True, text=True, encoding='utf-8')
    
    if p_gen.returncode != 0:
        print(f"[ERROR] Lỗi khi chạy gen-prompt.py: {p_gen.stderr}", file=sys.stderr)
        sys.exit(1)
        
    print("-> Đã sinh storyboard thành công.")
    
    # 2. Chạy upload-higgsfield.py để compile video
    script_upload = os.path.join(workspace_dir, "skills", "tao-video-ai", "scripts", "upload-higgsfield.py")
    prompts_json = os.path.join(workspace_dir, "skills", "tao-video-ai", "output", "prompts.json")
    final_video = os.path.join(workspace_dir, "skills", "tao-video-ai", "output", "final_video.mp4")
    
    print(f"-> Đang chạy upload-higgsfield.py để render video...")
    p_upload = subprocess.run([
        sys.executable, script_upload, "--prompts-file", prompts_json, "--output", final_video
    ], capture_output=True, text=True, encoding='utf-8')
    
    if p_upload.returncode != 0:
        print(f"[ERROR] Lỗi khi chạy upload-higgsfield.py: {p_upload.stderr}", file=sys.stderr)
        sys.exit(1)
        
    print("-> Đã kết xuất video và sinh chỉ dẫn upload thành công.")
    
    # Tạo Caption
    caption = generate_brand_caption(topic)
    
    # Lưu các thông tin phân cảnh vào file output của tao-creative-fb
    meta_output = os.path.join(workspace_dir, "skills", "tao-creative-fb", "output", "video_post_meta.json")
    with open(meta_output, 'w', encoding='utf-8') as f:
        json.dump({
            "topic": topic,
            "video_path": final_video.replace("\\", "/"),
            "caption": caption
        }, f, indent=2, ensure_ascii=False)
        
    # Ghi nhận chủ đề đã sử dụng
    save_to_history(topic, history_path)
    
    print("\n" + "="*50)
    print(" QUY TRÌNH VIDEO MODE ĐÃ SẴN SÀNG ")
    print("="*50)
    print(f"1. Chủ đề: {topic}")
    print(f"2. Video nháp: {final_video}")
    print(f"3. Caption thương hiệu:\n\n{caption}")
    print("="*50)
    print("\n[READY] Hãy gửi tin nhắn duyệt video và caption này cho Sếp trên Telegram!")

if __name__ == "__main__":
    main()
