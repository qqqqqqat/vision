import cv2
import numpy as np
import uuid
from config import IMAGE_FOLDER

# รวมภาพเป็นพาโนรามา
def create_panorama(images):
    stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)
    status, panorama = stitcher.stitch(images)

    if status != cv2.Stitcher_OK:
        print(f"Stitching failed with status {status}")
        return None
    return panorama

# ครอปภาพให้เน้นที่กลางภาพ
def crop_horizontal(image, crop_height_ratio=0.5):
    height, width = image.shape[:2]
    crop_height = int(height * crop_height_ratio)
    start_y = (height - crop_height) // 2
    return image[start_y:start_y + crop_height, :]

# ปรับความคมชัด
def enhance_image(image, scale_factor=2):
    height, width = image.shape[:2]
    resized_image = cv2.resize(image, (width * scale_factor, height * scale_factor), interpolation=cv2.INTER_CUBIC)

    gaussian = cv2.GaussianBlur(resized_image, (0, 0), sigmaX=3, sigmaY=3)
    sharpened = cv2.addWeighted(resized_image, 1.5, gaussian, -0.5, 0)

    return sharpened

# บันทึกภาพที่ประมวลผลแล้ว
def save_processed_image(image):
    filename = f"{IMAGE_FOLDER}/processed_{uuid.uuid4()}.jpg"
    cv2.imwrite(filename, image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return filename
