"use client";

import { useState, useEffect, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import Camera from "../components/Camera";
import ProgressBar from "../components/ProgressBar";
import CaptureButton from "../components/Capture";
import ProcessedImage from "../components/ProcessImage";
import OCRText from "../components/OCR";
import AudioPlayer from "../components/Audio";
import { captureImage, captureSingleImage, processImage } from "../services/api";

export default function HomePage() {
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImage, setProcessedImage] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const pressStartTime = useRef(null);
  const webcamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // ✅ ถ่ายภาพปกติ
  const handleSingleCapture = async () => {
    if (loading) return; // ❌ ป้องกันการกดซ้ำระหว่างโหลด

    setLoading(true);
    setProgress(20);

    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          const response = await captureSingleImage(imageSrc);
          setProcessedImage(response.data.processed_image);
          setBoundingBoxes(response.data.bounding_boxes);
          setOcrText(response.data.ocr_text);
          setAudioUrl(response.data.audio_url);
        } catch (error) {
          alert("📌 ไม่สามารถอ่านข้อความได้ กรุณาถ่ายใหม่!");
        }
      }
    }
    setProgress(100);
    setTimeout(() => setLoading(false), 500);
  };

  // ✅ เริ่มถ่ายพาโนรามาทุก 1 วินาที (ป้องกันถ่ายซ้ำ)
  const startPanoramaCapture = () => {
    if (captureIntervalRef.current) return; // ❌ ป้องกันการถ่ายซ้ำ

    setCapturing(true);
    captureIntervalRef.current = setInterval(async () => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          await captureImage(imageSrc);
        }
      }
    }, 1000);
  };

  // ✅ หยุดถ่ายพาโนรามาและประมวลผล
  const stopPanoramaCapture = async () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    setCapturing(false);
    setLoading(true);
    setProgress(30);

    try {
      const response = await processImage();
      setProcessedImage(response.data.processed_image);
      setBoundingBoxes(response.data.bounding_boxes);
      setOcrText(response.data.ocr_text);
      setAudioUrl(response.data.audio_url);
      setProgress(100);
      setProcessingComplete(true);
    } catch (error) {
      alert("📌 ไม่สามารถสร้างพาโนรามาได้ กรุณาถ่ายใหม่!");
    }

    setTimeout(() => setLoading(false), 500);
  };

  // ✅ ตรวจจับการกดปุ่ม
  const bind = useGesture({
    onPointerDown: () => {
      if (loading) return; // ❌ ป้องกันการกดถ่ายซ้ำระหว่างโหลด
      pressStartTime.current = Date.now();

      if (!capturing) {
        startPanoramaCapture();
      }
    },
    onPointerUp: async () => {
      const pressDuration = Date.now() - pressStartTime.current;

      if (pressDuration < 300) {
        await handleSingleCapture();
      } else {
        await stopPanoramaCapture();
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">📸 ระบบถ่ายภาพ</h1>
      {processingComplete && <p className="text-green-400 font-bold">✔ ประมวลผลเสร็จสิ้น</p>}
      <Camera capturing={capturing} webcamRef={webcamRef} />
      {loading && <ProgressBar progress={progress} />}
      <CaptureButton bind={bind} capturing={capturing} disabled={loading} />
      {processedImage && <ProcessedImage processedImage={processedImage} boundingBoxes={boundingBoxes} />}
      {ocrText && <OCRText text={ocrText} />}
      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </div>
  );
}
