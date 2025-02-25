import os

# ตั้งค่า Google Cloud Vision API Key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "ultra-helper-450709-n7-35a2b8296d16.json"

# พาธที่ใช้เก็บไฟล์ที่ประมวลผล
IMAGE_FOLDER = "static/images"
AUDIO_FOLDER = "static/audio"

# สร้างโฟลเดอร์หากยังไม่มี
os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)
