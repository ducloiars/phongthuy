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
    
    # 3 Angles configuration
    angles = [
        {
            "name": "Pain Point",
            "type": "pain_point",
            "topic": "Bận rộn lận đận công việc/gia đạo nhưng lòng vẫn hoang mang, mỏi mệt đủ đường",
            "img_prompt": "A professional typography poster. Background: A dark wooden desk with a single dim lamp illuminating a cluttered workspace, rain streaking down the window pane outside at night, melancholic and lonely atmosphere. Layout: centered typography with NTPT script signature.",
            "img_filename": "ads_pain_point.png"
        },
        {
            "name": "Solution",
            "type": "solution",
            "topic": "Quay về tĩnh lặng, đơn giản hóa công việc bằng cách ứng dụng AI thực chiến để giải phóng bản thân",
            "img_prompt": "A professional typography poster. Background: A tranquil outdoor zen garden with smooth river stones, a small green bamboo water fountain dripping water, warm afternoon sun rays filtering through green maple leaves, peaceful atmosphere. Layout: centered typography with NTPT script signature.",
            "img_filename": "ads_solution.png"
        },
        {
            "name": "Social Proof",
            "type": "social_proof",
            "topic": "Học viên trung niên tìm thấy sự an yên, gia đạo hanh thông sau khi biết cách làm chủ công nghệ AI",
            "img_prompt": "A professional typography poster. Background: A warm, cozy room with morning sunlight streaming through the window, a green plant in a terracotta pot next to a cup of coffee on a clean rustic wooden desk, cozy and hopeful vibe. Layout: centered typography with NTPT script signature.",
            "img_filename": "ads_social_proof.png"
        }
    ]
    
    print("=" * 60)
    print("STARTING MODE 2 - CREATIVE ADS TESTING (3 SETS)")
    print("=" * 60)
    
    for idx, angle in enumerate(angles, 1):
        print(f"\n--- BỘ {idx}: {angle['name'].upper()} ---")
        
        # 1. Gen caption
        caption_args = [
            python_exe,
            os.path.join(scripts_dir, "gen_caption.py"),
            "--topic", angle["topic"],
            "--mode", "ads",
            "--angle", angle["type"]
        ]
        
        stdout_output = run_cmd(caption_args)
        if not stdout_output:
            print("Skipping this set due to caption generation failure.")
            continue
            
        # Parse the caption from output block
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
        
        # 2. Gen image
        out_image_path = os.path.join(output_dir, angle["img_filename"])
        image_args = [
            python_exe,
            os.path.join(scripts_dir, "gen_image.py"),
            "--prompt", angle["img_prompt"],
            "--quality", "medium",
            "--model", "gpt-image-1",
            "--output", out_image_path
        ]
        
        img_output = run_cmd(image_args)
        if not img_output:
            print("Skipping image printing due to script failure.")
            continue
            
        print("\n>>> KẾT QUẢ CẶP GHÉP ĐÔI:")
        print(f"1. Đường dẫn ảnh: {out_image_path}")
        print("2. Ad Copy:")
        print("-" * 40)
        print(caption_content)
        print("-" * 40)
        
    print("\n" + "=" * 60)
    print("MODE 2 TESTING COMPLETED. Check output/ directory for images.")
    print("=" * 60)

if __name__ == "__main__":
    main()
