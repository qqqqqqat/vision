from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from google.cloud import vision
from gtts import gTTS
from PIL import Image
import io
import os
import uuid

# ตั้งค่า Google Cloud Vision API
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "ultra-helper-450709-n7-35a2b8296d16.json"

# สร้าง FastAPI App
app = FastAPI()

# เพิ่ม CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# เก็บภาพที่ถ่ายไว้
captured_images = []

# OCR ด้วย Google Vision API
def google_ocr(image):
    client = vision.ImageAnnotatorClient()
    image_pil = Image.fromarray(image)
    with io.BytesIO() as output:
        image_pil.save(output, format="JPEG")
        content = output.getvalue()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations
    return texts[0].description if texts else ""

# แปลงข้อความเป็นเสียง
def text_to_speech(text, lang='th'):
    tts = gTTS(text, lang=lang)
    audio_path = f"audio_{uuid.uuid4()}.mp3"
    tts.save(audio_path)
    return audio_path

# รวมภาพเป็นพาโนรามา
def create_panorama(images):
    stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)
    status, panorama = stitcher.stitch(images)
    if status != cv2.Stitcher_OK:
        print(f"Stitching failed with status {status}")
        return None
    return panorama

# ครอปภาพตามแนวตรงกลางแนวนอนโดยตัดส่วนบนและล่างออก
def crop_horizontal(image, crop_height_ratio=0.5):
    height, width = image.shape[:2]
    crop_height = int(height * crop_height_ratio)  # ตัดให้เหลือ 50% ของความสูง
    start_y = (height - crop_height) // 2  # เริ่มตัดจากตรงกลาง
    cropped_image = image[start_y:start_y + crop_height, :]
    return cropped_image

# ปรับความคมชัดของภาพโดยไม่แปลงเป็น grayscale
def enhance_image(image, scale_factor=2):
    height, width = image.shape[:2]
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)
    resized_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)

    # เพิ่มความคมชัดด้วย Unsharp Masking
    gaussian = cv2.GaussianBlur(resized_image, (0, 0), sigmaX=3, sigmaY=3)
    sharpened = cv2.addWeighted(resized_image, 1.5, gaussian, -0.5, 0)
    
    return sharpened

# รับภาพจาก Frontend
@app.post("/api/capture")
async def capture_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    captured_images.append(img)
    return JSONResponse({"message": "Image captured successfully"})

# ประมวลผลภาพ: สร้างพาโนรามา, ครอปแนวนอน, เพิ่มความคมชัด, OCR, TTS
@app.post("/api/process_image")
async def process_image():
    if len(captured_images) < 2:
        return JSONResponse({"error": "ไม่พบภาพเพียงพอในการสร้างพาโนรามา"}, status_code=400)

    # สร้างภาพพาโนรามา
    panorama_image = create_panorama(captured_images)
    if panorama_image is None:
        return JSONResponse({"error": "ไม่สามารถสร้างพาโนรามาได้, กรุณาถ่ายภาพให้ซ้อนกันมากขึ้น"}, status_code=500)

    # ครอปภาพตรงกลางในแนวนอน (50% ของความสูงเดิม)
    cropped_image = crop_horizontal(panorama_image, crop_height_ratio=0.5)

    # ปรับความคมชัด
    enhanced_image = enhance_image(cropped_image)

    # ทำ OCR
    ocr_text = google_ocr(enhanced_image)

    # บันทึกภาพที่ผ่านการประมวลผลแล้ว
    processed_filename = f"processed_{uuid.uuid4()}.jpg"
    cv2.imwrite(processed_filename, enhanced_image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

    # แปลงข้อความเป็นเสียง
    audio_path = text_to_speech(ocr_text)

    # ล้างภาพในหน่วยความจำ
    captured_images.clear()

    return {
        "processed_image": f"/api/get_image/{processed_filename}",
        "ocr_text": ocr_text,
        "audio_url": f"/api/get_audio/{audio_path}"
    }

# ดึงภาพที่บันทึกไว้
@app.get("/api/get_image/{filename}")
async def get_image(filename: str):
    return FileResponse(filename)

# ดึงไฟล์เสียง
@app.get("/api/get_audio/{filename}")
async def get_audio(filename: str):
    return FileResponse(filename, media_type="audio/mp3")

# รันเซิร์ฟเวอร์
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
