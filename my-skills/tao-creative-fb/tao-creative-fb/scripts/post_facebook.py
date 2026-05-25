import os
import sys
import argparse
import requests

# Reconfigure stdout/stderr to support UTF-8 on Windows consoles
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv()

def post_to_facebook(image_path, caption_text, dry_run_override=None):
    # Check if DRY_RUN is set in env or overridden by CLI arg
    env_dry_run = os.getenv("DRY_RUN", "false").lower() == "true"
    dry_run = dry_run_override if dry_run_override is not None else env_dry_run
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at path: {image_path}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Publishing to Facebook...")
    print(f"Image path: {image_path}")
    print(f"Caption: {caption_text[:100]}... ({len(caption_text)} chars)")
    
    if dry_run:
        print("\n=== [DRY RUN MODE ENABLED] ===")
        print("Facebook Graph API call simulated. No actual post was made.")
        
        # Save caption to a txt file next to the image for local review
        txt_path = os.path.splitext(image_path)[0] + ".txt"
        try:
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(caption_text)
            print(f"Dry run text copy saved locally at: {txt_path}")
        except Exception as e:
            print(f"Warning: Could not save text copy locally: {e}", file=sys.stderr)
            
        print("==============================")
        return True
        
    # Real posting mode via /{page-id}/photos endpoint
    page_id = os.getenv("FB_PAGE_ID")
    page_token = os.getenv("FB_PAGE_TOKEN")
    
    if not page_id or not page_token:
        print("Error: FB_PAGE_ID and FB_PAGE_TOKEN must be configured in your environment for live posting.", file=sys.stderr)
        sys.exit(1)
        
    try:
        # Upload photo and caption simultaneously
        print("Uploading photo and caption directly to Facebook Page...")
        upload_url = f"https://graph.facebook.com/v19.0/{page_id}/photos"
        with open(image_path, 'rb') as img_file:
            files = {'source': img_file}
            data = {
                'caption': caption_text,
                'access_token': page_token
            }
            response = requests.post(upload_url, files=files, data=data, timeout=60)
            res_data = response.json()
            
            if response.status_code == 200:
                photo_id = res_data.get('id')
                post_id = res_data.get('post_id')
                print("Facebook Post published to timeline feed successfully in a single request!")
                print(f"Photo ID: {photo_id}, Post ID: {post_id}")
                return True
            else:
                print(f"Facebook Graph API Photos Error (HTTP {response.status_code}):", file=sys.stderr)
                print(res_data, file=sys.stderr)
                sys.exit(1)
            
    except Exception as e:
        print(f"Failed to post to Facebook: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload image and caption to Facebook Page")
    parser.add_argument("--image", required=True, help="Path to local image file")
    parser.add_argument("--caption", required=True, help="Caption text to upload with the photo")
    parser.add_argument("--dry-run", action="store_true", help="Override environment and force dry run")
    
    args = parser.parse_args()
    post_to_facebook(args.image, args.caption, dry_run_override=args.dry_run if args.dry_run else None)
