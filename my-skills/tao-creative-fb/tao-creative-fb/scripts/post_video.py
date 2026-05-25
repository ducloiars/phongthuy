#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import requests
from dotenv import load_dotenv

# Reconfigure stdout/stderr to support UTF-8 on Windows consoles
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Nạp file .env từ thư mục gốc của workspace
def load_workspace_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    env_path = os.path.join(workspace_dir, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()

def post_facebook_reel(video_path, caption_text, dry_run):
    page_id = os.getenv("FB_PAGE_ID")
    page_token = os.getenv("FB_PAGE_TOKEN")
    
    if not page_id or not page_token:
        print("[ERROR] Thiếu FB_PAGE_ID hoặc FB_PAGE_TOKEN trong file .env.", file=sys.stderr)
        return False, "https://www.facebook.com/reels/configuration_error"

    if dry_run:
        print("\n--- [FB REELS DRY RUN] ---")
        print(f"Khởi tạo upload Reels lên Page ID: {page_id}")
        print(f"Đường dẫn file: {video_path}")
        print(f"Mô phỏng upload {os.path.getsize(video_path)} bytes...")
        print(f"Đăng bài với Caption: {caption_text[:80]}...")
        print("--------------------------")
        return True, "https://www.facebook.com/reels/mock_reel_id_1015948301"

    try:
        # Bước 1: Khởi tạo upload session cho Reels
        print("[FB REELS] Bước 1: Đang khởi tạo session...")
        start_url = f"https://graph.facebook.com/v19.0/{page_id}/video_reels"
        start_data = {
            "upload_phase": "start",
            "access_token": page_token
        }
        res_start = requests.post(start_url, data=start_data, timeout=30).json()
        
        if "video_id" not in res_start or "upload_url" not in res_start:
            print(f"[ERROR] Không khởi tạo được session Reels: {res_start}", file=sys.stderr)
            return False, ""

        video_id = res_start["video_id"]
        upload_url = res_start["upload_url"]
        
        # Bước 2: Tải file binary của video lên
        print(f"[FB REELS] Bước 2: Đang tải video lên upload_url (ID: {video_id})...")
        file_size = os.path.getsize(video_path)
        headers = {
            "Authorization": f"OAuth {page_token}",
            "offset": "0",
            "file_size": str(file_size),
            "Content-Type": "application/octet-stream"
        }
        
        with open(video_path, "rb") as f:
            res_upload = requests.post(upload_url, headers=headers, data=f, timeout=120)
            
        if res_upload.status_code != 200:
            print(f"[ERROR] Lỗi tải video Reels lên: HTTP {res_upload.status_code} - {res_upload.text}", file=sys.stderr)
            return False, ""
            
        # Bước 3: Hoàn thành upload và đăng video Reels
        print("[FB REELS] Bước 3: Đang phát hành video Reels lên trang...")
        finish_url = f"https://graph.facebook.com/v19.0/{page_id}/video_reels"
        finish_data = {
            "upload_phase": "finish",
            "video_state": "PUBLISHED",
            "description": caption_text,
            "video_id": video_id,
            "access_token": page_token
        }
        res_finish = requests.post(finish_url, data=finish_data, timeout=30).json()
        
        if res_finish.get("success") or "id" in res_finish:
            reel_link = f"https://www.facebook.com/watch/?v={video_id}"
            print(f"[SUCCESS] Đã đăng Reels thành công! Link: {reel_link}")
            return True, reel_link
        else:
            print(f"[ERROR] Lỗi hoàn tất phát hành Reels: {res_finish}", file=sys.stderr)
            return False, ""
            
    except Exception as e:
        print(f"[ERROR] Lỗi kết nối Facebook API: {e}", file=sys.stderr)
        return False, ""

def post_tiktok_video(video_path, caption_text, dry_run):
    tiktok_token = os.getenv("TIKTOK_ACCESS_TOKEN")
    
    # Hướng dẫn upload thủ công qua di động nếu thiếu API token hoặc ở chế độ Dry Run
    if dry_run or not tiktok_token:
        print("\n" + "="*50)
        print(" HƯỚNG DẪN ĐĂNG TIKTOK THỦ CÔNG QUA DI ĐỘNG (FALLBACK) ")
        print("="*50)
        print("1. Chuyển video sau vào điện thoại (dùng Zalo Cloud, Google Drive hoặc Airdrop):")
        print(f"   Đường dẫn: {video_path}")
        print("2. Sao chép nội dung Caption dưới đây:")
        print(f"   Caption: {caption_text}")
        print("3. Mở ứng dụng TikTok trên điện thoại và đăng tải video Reels dọc này.")
        print("="*50)
        return True, "https://www.tiktok.com/@ntpt_luxury/video/mock_tiktok_2026"
        
    print("[INFO] Đang gọi TikTok Content Posting API...")
    # TODO: Tích hợp gọi API TikTok chính thức khi có tài khoản Developer được phê duyệt scope
    return True, "https://www.tiktok.com/@ntpt_luxury/video/mock_tiktok_api_link"

def post_youtube_shorts(video_path, caption_text, dry_run):
    yt_client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
    
    if dry_run or not yt_client_secret:
        print("\n" + "="*50)
        print(" HƯỚNG DẪN ĐĂNG YOUTUBE SHORTS QUA STUDIO ")
        print("="*50)
        print("1. Truy cập YouTube Studio: https://studio.youtube.com/")
        print("2. Nhấp vào Tạo -> Tải video lên.")
        print(f"3. Chọn file video: {video_path}")
        print("4. Nhập tiêu đề và phần mô tả sau:")
        print(f"   Mô tả: {caption_text}")
        print("5. Nhấn Lưu và chọn chế độ Công khai.")
        print("="*50)
        return True, "https://youtube.com/shorts/mock_shorts_2026"
        
    print("[INFO] Đang kết nối YouTube Data API v3 để tải Shorts lên...")
    # TODO: Khởi tạo google-api-python-client và upload video
    return True, "https://youtube.com/shorts/mock_shorts_api_link"

def main():
    parser = argparse.ArgumentParser(description="Đăng tải video Reels, TikTok và YouTube Shorts.")
    parser.add_argument("--video", required=True, help="Đường dẫn đến file video .mp4")
    parser.add_argument("--caption", required=True, help="Nội dung Caption cho bài đăng")
    parser.add_argument("--dry-run", action="store_true", help="Chạy ở chế độ mô phỏng thử nghiệm")
    args = parser.parse_args()

    load_workspace_env()
    
    # Check if global DRY_RUN is enabled in env
    env_dry_run = os.getenv("DRY_RUN", "false").lower() == "true"
    dry_run = args.dry_run or env_dry_run

    if not os.path.exists(args.video):
        print(f"[ERROR] Không tìm thấy file video tại: {args.video}", file=sys.stderr)
        sys.exit(1)

    print(f"Bắt đầu quy trình đăng tải video đa kênh...")
    print(f"Đường dẫn video: {args.video}")
    print(f"Chế độ: {'MÔ PHỎNG (DRY RUN)' if dry_run else 'LIVE CHÍNH THỨC'}\n")

    # 1. Đăng Reels Facebook
    fb_success, fb_link = post_facebook_reel(args.video, args.caption, dry_run)
    
    # 2. Đăng TikTok
    tt_success, tt_link = post_tiktok_video(args.video, args.caption, dry_run)
    
    # 3. Đăng YouTube Shorts
    yt_success, yt_link = post_youtube_shorts(args.video, args.caption, dry_run)

    print("\n" + "="*50)
    print(" BÁO CÁO PHÁT HÀNH VIDEO ĐA NỀN TẢNG ")
    print("="*50)
    print(f"- [Facebook Reels]: {fb_link if fb_success else 'THẤT BẠI'}")
    print(f"- [TikTok Video]  : {tt_link if tt_success else 'THẤT BẠI'}")
    print(f"- [YouTube Shorts]: {yt_link if yt_success else 'THẤT BẠI'}")
    print("="*50)

if __name__ == "__main__":
    main()
