#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import sys

def list_product_images():
    # Thư mục chứa ảnh nằm tại thư mục gốc của workspace (bên ngoài thư mục skills)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    product_photos_dir = os.path.join(workspace_dir, "product-photos")

    # Fallback nếu chạy ở thư mục hiện hành khác
    if not os.path.exists(product_photos_dir):
        product_photos_dir = os.path.abspath("product-photos")

    if not os.path.exists(product_photos_dir):
        print(json.dumps({"error": f"Directory not found: {product_photos_dir}"}, ensure_ascii=False))
        return []

    valid_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.bmp')
    images = []

    try:
        for filename in os.listdir(product_photos_dir):
            if filename.lower().endswith(valid_extensions):
                full_path = os.path.join(product_photos_dir, filename)
                images.append({
                    "name": filename,
                    "path": full_path.replace("\\", "/")
                })
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        return []

    return images

if __name__ == "__main__":
    images = list_product_images()
    # In ra dạng JSON đẹp để agent hoặc script khác dễ dàng phân tích
    print(json.dumps(images, indent=2, ensure_ascii=False))
