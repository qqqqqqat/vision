"use client";

import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useGesture } from "@use-gesture/react";

export default function PanoramaCapture() {
  const [capturing, setCapturing] = useState(false);
  const [detectedTexts, setDetectedTexts] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const webcamRef = useRef(null);

  // ตรวจจับการกดค้างเพื่อถ่ายภาพ
  const bind = useGesture({
    onPointerDown: () => startCapturing(),
    onPointerUp: () => stopCapturing(),
  });

  // ถ่ายภาพทุก 0.3 วินาที
  useEffect(() => {
    let captureInterval;
    if (capturing) {
      captureInterval = setInterval(() => {
        captureImage();
      }, 300);
    } else {
      clearInterval(captureInterval);
    }
    return () => clearInterval(captureInterval);
  }, [capturing]);

  // ตรวจจับข้อความจากกล้องทุก 0.5 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      detectTextInFrame();
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // เริ่มถ่ายภาพ
  const startCapturing = () => {
    setCapturing(true);
  };

  // หยุดถ่ายภาพและสร้างพาโนรามา
  const stopCapturing = async () => {
    setCapturing(false);
    try {
      const response = await axios.post("http://192.168.35.43:8000/api/process_image");
      setOcrText(response.data.ocr_text);
      setAudioUrl(`http://192.168.35.43:8000${response.data.audio_url}`);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างพาโนรามา:", error);
    }
  };

  // ถ่ายภาพและบันทึก
  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const formData = new FormData();
    formData.append("file", dataURLtoBlob(imageSrc), "capture.jpg");

    try {
      await axios.post("http://192.168.35.43:8000/api/capture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการถ่ายภาพ:", error);
    }
  };

  // ตรวจจับข้อความในเฟรมแบบเรียลไทม์
  const detectTextInFrame = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const formData = new FormData();
    formData.append("file", dataURLtoBlob(imageSrc), "capture.jpg");

    try {
      const response = await axios.post("http://192.168.35.43:8000/api/detect_text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDetectedTexts(response.data.detected_texts);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตรวจจับข้อความ:", error);
    }
  };

  // แปลง DataURL เป็น Blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div data-theme="dark" className="min-h-screen bg-base-200 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">📸 ระบบถ่ายภาพพาโนรามาและตรวจจับข้อความ</h1>

      {/* กล้องพร้อมกรอบตรวจจับข้อความ */}
      <div className="relative w-full max-w-md">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }}
          className="rounded-lg shadow-lg"
        />

        {/* กรอบ Highlight รอบข้อความที่ตรวจจับได้ */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {detectedTexts.map((text, index) => {
            const { box } = text;
            const style = {
              position: "absolute",
              top: `${(box[0].y / 1080) * 100}%`,
              left: `${(box[0].x / 1920) * 100}%`,
              width: `${((box[2].x - box[0].x) / 1920) * 100}%`,
              height: `${((box[2].y - box[0].y) / 1080) * 100}%`,
              border: "2px solid rgba(255, 255, 255, 0.8)",
              borderRadius: "4px",
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.6)",
            };
            return <div key={index} style={style} />;
          })}
        </div>
      </div>

      {/* ปุ่มถ่ายภาพแบบกดค้าง */}
      <button
        {...bind()}
        className={`btn btn-accent mt-4 ${capturing ? "btn-error" : ""}`}
      >
        {capturing ? "กำลังถ่ายภาพ..." : "📸 กดค้างเพื่อถ่ายพาโนรามา"}
      </button>

      {/* แสดงข้อความ OCR */}
      {ocrText && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">🔍 ข้อความจาก OCR:</h2>
          <p className="p-4 bg-gray-800 rounded-lg shadow">{ocrText}</p>
        </div>
      )}

      {/* เล่นเสียงอ่านข้อความ */}
      {audioUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">🔊 เสียงอ่านข้อความ:</h2>
          <audio controls src={audioUrl} className="mt-2"></audio>
        </div>
      )}
    </div>
  );
}
