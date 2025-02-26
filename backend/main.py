from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
import numpy as np
import cv2
import uuid
import os
from fastapi.middleware.cors import CORSMiddleware
from services.ocr import google_ocr_with_boxes
from services.process_image import create_panorama, crop_horizontal, enhance_image
from services.audio import text_to_speech
from config import IMAGE_FOLDER, AUDIO_FOLDER

# ตั้งค่า Base URL สำหรับการเข้าถึงไฟล์ผ่าน API
BASE_URL = "http://192.168.35.43:8000"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

captured_images = []

# ✅ API รับภาพจากกล้องเพื่อเก็บในเซิร์ฟเวอร์
@app.post("/api/capture")
async def capture_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    captured_images.append(img)

    return JSONResponse({"message": "Image captured successfully", "total_images": len(captured_images)})

@app.post("/api/capture_single")
async def capture_single_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    detected_texts = google_ocr_with_boxes(img)
    
    # ✅ ดักจับกรณีไม่เจอข้อความ
    if not detected_texts:
        return JSONResponse({"error": "ไม่สามารถอ่านข้อความได้ กรุณาถ่ายใหม่"}, status_code=400)

    ocr_text = "\n".join([text["text"] for text in detected_texts])

    filename = f"single_processed_{uuid.uuid4()}.jpg"
    processed_filepath = os.path.join(IMAGE_FOLDER, filename)
    cv2.imwrite(processed_filepath, img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

    audio_filename = text_to_speech(ocr_text)

    return {
        "processed_image": f"{BASE_URL}/api/get_image/{filename}",
        "ocr_text": ocr_text,
        "bounding_boxes": detected_texts,
        "audio_url": f"{BASE_URL}/api/get_audio/{audio_filename}"
    }

@app.post("/api/process_image")
async def process_image():
    print(f"📸 จำนวนภาพที่บันทึกไว้: {len(captured_images)}")
    if len(captured_images) < 2:
        return JSONResponse({"error": "ไม่พบภาพเพียงพอในการสร้างพาโนรามา"}, status_code=400)

    panorama_image = create_panorama(captured_images)
    cropped_image = crop_horizontal(panorama_image)
    enhanced_image = enhance_image(cropped_image)

    detected_texts = google_ocr_with_boxes(enhanced_image)

    # ✅ ดักจับกรณีไม่พบข้อความ OCR
    if not detected_texts:
        return JSONResponse({"error": "ไม่สามารถอ่านข้อความจากภาพพาโนรามาได้ กรุณาถ่ายใหม่"}, status_code=400)

    ocr_text = "\n".join([text["text"] for text in detected_texts])

    filename = f"processed_{uuid.uuid4()}.jpg"
    processed_filepath = os.path.join(IMAGE_FOLDER, filename)
    cv2.imwrite(processed_filepath, enhanced_image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

    audio_filename = text_to_speech(ocr_text)

    captured_images.clear()

    return {
        "processed_image": f"{BASE_URL}/api/get_image/{filename}",
        "ocr_text": ocr_text,
        "bounding_boxes": detected_texts,
        "audio_url": f"{BASE_URL}/api/get_audio/{audio_filename}"
    }

# ✅ API สำหรับดึงรูปภาพที่บันทึกไว้
@app.get("/api/get_image/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(IMAGE_FOLDER, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse({"error": "Image not found"}, status_code=404)

# ✅ API สำหรับดึงไฟล์เสียงที่บันทึกไว้
@app.get("/api/get_audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(AUDIO_FOLDER, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mp3")
    return JSONResponse({"error": "Audio not found"}, status_code=404)
