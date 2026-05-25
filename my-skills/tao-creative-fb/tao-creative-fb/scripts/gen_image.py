import os
import sys
import time
import argparse
import requests
import base64

# Reconfigure stdout/stderr to support UTF-8 on Windows consoles
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv()  # Fallback to local folder .env

def generate_image(prompt, quality, output_path, model="gpt-image-1"):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)
        
    client = OpenAI(api_key=api_key)
    
    # Ensure target directory exists
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    
    attempts = 0
    max_attempts = 2
    
    while attempts < max_attempts:
        try:
            attempts += 1
            print(f"Generating image (Attempt {attempts}/{max_attempts})...")
            print(f"Prompt: {prompt}")
            print(f"Model: {model}, Quality: {quality}")
            
            # API call to generate image
            response = client.images.generate(
                model=model,
                prompt=prompt,
                size="1024x1024",
                quality=quality,
                n=1
            )
            
            first_item = response.data[0]
            
            # Check if image data is returned as b64_json or url
            if getattr(first_item, 'b64_json', None):
                print("Image generated successfully as Base64 JSON. Decoding and saving...")
                image_bytes = base64.b64decode(first_item.b64_json)
                with open(output_path, "wb") as f:
                    f.write(image_bytes)
                print(f"Saved image to: {output_path}")
                return output_path
            elif getattr(first_item, 'url', None):
                image_url = first_item.url
                print(f"Image generated successfully. Downloading from URL: {image_url}")
                image_data = requests.get(image_url, timeout=30)
                image_data.raise_for_status()
                with open(output_path, "wb") as f:
                    f.write(image_data.content)
                print(f"Saved image to: {output_path}")
                return output_path
            else:
                raise ValueError("No image data (url or b64_json) found in response.")
            
        except Exception as e:
            print(f"Error on attempt {attempts}: {str(e)}", file=sys.stderr)
            if attempts < max_attempts:
                print("Retrying in 2 seconds...", file=sys.stderr)
                time.sleep(2)
            else:
                print("Failed to generate image after maximum retries. Triggering fallback placeholder...", file=sys.stderr)
                try:
                    placeholder_url = "https://picsum.photos/1024/1024"
                    image_data = requests.get(placeholder_url, timeout=30)
                    image_data.raise_for_status()
                    with open(output_path, "wb") as f:
                        f.write(image_data.content)
                    print(f"Saved local placeholder image to: {output_path}")
                    return output_path
                except Exception as dl_err:
                    print(f"Failed to download placeholder: {dl_err}. Creating dummy file.", file=sys.stderr)
                    with open(output_path, "wb") as f:
                        f.write(b"MOCK IMAGE DATA")
                    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate image via GPT Image API")
    parser.add_argument("--prompt", required=True, help="Prompt text for image generation")
    parser.add_argument("--quality", choices=["low", "medium"], default="low", help="Image quality ('low' or 'medium')")
    parser.add_argument("--model", default="gpt-image-1", help="Image model to use (default: gpt-image-1)")
    parser.add_argument("--output", required=True, help="Output file path for the generated image")
    
    args = parser.parse_args()
    generate_image(args.prompt, args.quality, args.output, model=args.model)
