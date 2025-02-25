from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import uuid
from services.ocr import google_ocr, google_ocr_with_boxes
from services.process_image import create_panorama, crop_horizontal, enhance_image, save_processed_image
from services.audio import text_to_speech

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

@app.post("/api/capture")
async def capture_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    captured_images.append(img)
    return JSONResponse({"message": "Image captured successfully"})

# รับภาพถ่ายปกติ
@app.post("/api/capture_single")
async def capture_single_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # ตรวจจับข้อความและ Bounding Box
    detected_texts = google_ocr_with_boxes(img)
    ocr_text = "\n".join([text["text"] for text in detected_texts])

    # บันทึกภาพที่ผ่านการประมวลผลแล้ว
    processed_filename = f"single_processed_{uuid.uuid4()}.jpg"
    cv2.imwrite(processed_filename, img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

    # แปลงข้อความเป็นเสียง
    audio_path = text_to_speech(ocr_text)

    return {
        "processed_image": f"/api/get_image/{processed_filename}",
        "ocr_text": ocr_text,
        "bounding_boxes": detected_texts,
        "audio_url": f"/api/get_audio/{audio_path}"
    }


@app.post("/api/process_image")
async def process_image():
    if len(captured_images) < 2:
        return JSONResponse({"error": "ไม่พบภาพเพียงพอในการสร้างพาโนรามา"}, status_code=400)

    panorama_image = create_panorama(captured_images)
    if panorama_image is None:
        return JSONResponse({"error": "ไม่สามารถสร้างพาโนรามาได้"}, status_code=500)

    cropped_image = crop_horizontal(panorama_image)
    enhanced_image = enhance_image(cropped_image)
    
    detected_texts = google_ocr_with_boxes(enhanced_image)
    ocr_text = "\n".join([text["text"] for text in detected_texts])

    processed_filename = save_processed_image(enhanced_image)
    audio_path = text_to_speech(ocr_text)

    captured_images.clear()

    return {
        "processed_image": f"/api/get_image/{processed_filename}",
        "ocr_text": ocr_text,
        "bounding_boxes": detected_texts,
        "audio_url": f"/api/get_audio/{audio_path}"
    }

@app.get("/api/get_image/{filename}")
async def get_image(filename: str):
    return FileResponse(filename)

@app.get("/api/get_audio/{filename}")
async def get_audio(filename: str):
    return FileResponse(filename, media_type="audio/mp3")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
