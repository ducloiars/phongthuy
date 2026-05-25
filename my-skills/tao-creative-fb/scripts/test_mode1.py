import os
import sys
import subprocess

# Ensure stdout supports UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

def run_cmd(args):
    print(f"Running command: {' '.join(args)}")
    result = subprocess.run(args, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Command failed with error:\n{result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def main():
    skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    scripts_dir = os.path.join(skill_dir, "scripts")
    output_dir = os.path.join(skill_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    python_exe = sys.executable
    
    print("=" * 60)
    print("STARTING MODE 1 - CONTENT FREE TESTING (DRY_RUN=TRUE)")
    print("=" * 60)
    
    # BƯỚC A: Lên 3 ý tưởng (Simulated)
    print("\n[Bước A] Đang tạo 3 ý tưởng bài đăng...")
    ideas = [
        {"title": "Học cách sống giản đơn", "angle": "Chia sẻ về sự trân trọng những gì hiện có để mang lại an yên."},
        {"title": "Đón nhận sóng gió số mệnh", "angle": "Nhìn nhận khó khăn như một bài học cần biết ơn."},
        {"title": "Tĩnh lặng để sửa mình", "angle": "Dành một khoảng lặng mỗi ngày để thanh lọc tâm trí."}
    ]
    
    for idx, idea in enumerate(ideas, 1):
        print(f"Ý tưởng {idx}: {idea['title']} - Góc tiếp cận: {idea['angle']}")
        
    # BƯỚC B: Sếp chọn 1 ý tưởng (Chọn ý tưởng số 1 làm mẫu test)
    selected_idx = 0
    selected_idea = ideas[selected_idx]
    print(f"\n[Bước B] Sếp Lợi chọn ý tưởng {selected_idx + 1}: {selected_idea['title']}")
    
    # Bước B1: Tạo Caption
    print("--> B1: Đang viết Caption theo Brand Voice...")
    caption_args = [
        python_exe,
        os.path.join(scripts_dir, "gen_caption.py"),
        "--topic", selected_idea["title"],
        "--mode", "organic"
    ]
    stdout_output = run_cmd(caption_args)
    if not stdout_output:
        print("Failed to generate caption.")
        sys.exit(1)
        
    caption_lines = stdout_output.split("\n")
    caption_text = []
    is_capture = False
    for line in caption_lines:
        if "=== GENERATED CAPTION ===" in line:
            is_capture = True
            continue
        if "=========================" in line and is_capture:
            is_capture = False
            break
        if is_capture:
            caption_text.append(line)
            
    caption_content = "\n".join(caption_text).strip()
    
    # Bước B2 & B3: Phân tích và tạo hình ảnh
    print("--> B2 & B3: Đang sinh hình ảnh bằng gpt-image-1 (quality low)...")
    out_image_path = os.path.join(output_dir, "organic_post.png")
    
    # Trích xuất 1 câu quote ngắn (simulated)
    quote = "🌿 Cuộc đời này đơn giản mới là an yên."
    img_prompt = f"A professional typography poster layout. Background: A serene morning scene with a warm cup of tea on a rustic wooden deck, soft sunrise light. Layout: Clean centered typography for the text: '{quote}' in bold letters. Signature NTPT in cursive script at bottom right."
    
    image_args = [
        python_exe,
        os.path.join(scripts_dir, "gen_image.py"),
        "--prompt", img_prompt,
        "--quality", "low",
        "--model", "gpt-image-1",
        "--output", out_image_path
    ]
    
    img_output = run_cmd(image_args)
    if not img_output:
        print("Failed to generate image.")
        sys.exit(1)
        
    # BƯỚC C: Xem trước bài đăng (Preview)
    print("\n[Bước C] XEM TRƯỚC BÀI ĐĂNG (PREVIEW):")
    print(f"- Ảnh bài viết: {out_image_path}")
    print("- Caption:")
    print("=" * 40)
    print(caption_content)
    print("=" * 40)
    
    # BƯỚC D: Đăng bài thử nghiệm (DRY RUN)
    print("\n[Bước D] Đăng bài lên Facebook (Chạy ở chế độ DRY_RUN=true)...")
    post_args = [
        python_exe,
        os.path.join(scripts_dir, "post_facebook.py"),
        "--image", out_image_path,
        "--caption", caption_content,
        "--dry-run"
    ]
    post_output = run_cmd(post_args)
    if post_output:
        print(post_output)
        print("\n--> ĐĂNG BÀI THỬ NGHIỆM THÀNH CÔNG!")
    else:
        print("Failed to run post script.")
        sys.exit(1)

if __name__ == "__main__":
    main()
