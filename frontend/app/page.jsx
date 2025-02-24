"use client";

import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useGesture } from "@use-gesture/react";

export default function PanoramaCapture() {
  const [capturing, setCapturing] = useState(false);
  const [images, setImages] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const webcamRef = useRef(null);

  // ใช้ Gesture Detection เพื่อตรวจจับการกดค้าง
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

  // เริ่มถ่ายภาพ
  const startCapturing = () => {
    setCapturing(true);
    setImages([]);
  };

  // หยุดถ่ายภาพและรวมภาพพาโนรามา
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
      <h1 className="text-3xl font-bold mb-6">📸 ระบบถ่ายภาพพาโนรามา</h1>

      {/* กล้อง */}
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
