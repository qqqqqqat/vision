### สร้าง Virtual Environment

`python -m venv myvenv`

### เปิดใช้งาน Virtual Environment

`myvenv\Scripts\activate.bat`

### ติดตั้งไลบรารี Backend

`pip install fastapi uvicorn opencv-contrib-python numpy pillow google-cloud-vision gTTS`

### RUN Backend

`uvicorn main:app --host 0.0.0.0 --port 8000`

### ติดตั้งไลบรารี Frontend

`npm install react-webcam @use-gesture/react axios tailwindcss daisyui`

### RUN Frontend

`npm run dev`

### เปิด Browser บนมือถือ

`http://<YOUR_IP>:3000/` IPv4 เครื่องคอมตัวเองและต้องเชื่อม Wi-Fi เดียวกัน

`axios.post("http://<YOUR_IP>:8000/api/process_image");` IPv4 เครื่องคอมตัวเอง ipconfig หมวด Wireless LAN adapter Wi-Fi
