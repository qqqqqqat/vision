"use client";

import { useState, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { Toaster, toast } from "react-hot-toast"; // ✅ เพิ่ม Hot Toast
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
  const pressTimeoutRef = useRef(null);
  const webcamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // ✅ ถ่ายภาพปกติ
  const handleSingleCapture = async () => {
    if (loading) return; // ❌ ป้องกันกดซ้ำ
    setLoading(true);
    toast.loading("📸 กำลังประมวลผล...", { id: "processing" });

    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          const response = await captureSingleImage(imageSrc);
          setProcessedImage(response.data.processed_image);
          setBoundingBoxes(response.data.bounding_boxes);
          setOcrText(response.data.ocr_text);
          setAudioUrl(response.data.audio_url);
          toast.success("✔ ถ่ายภาพสำเร็จ!", { id: "processing" });
        } catch (error) {
          toast.error("📌 ไม่สามารถอ่านข้อความได้ กรุณาถ่ายใหม่!", { id: "processing" });
        }
      }
    }
    setLoading(false);
  };

  // ✅ เริ่มถ่ายพาโนรามาทุก 1 วินาที
  const startPanoramaCapture = () => {
    if (captureIntervalRef.current) return; // ❌ ป้องกันถ่ายซ้ำ
    setCapturing(true);
    toast.loading("📸 กำลังถ่ายพาโนรามา...", { id: "processing" });

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
    toast.loading("🛠️ กำลังประมวลผลภาพพาโนรามา...", { id: "processing" });

    try {
      const response = await processImage();
      setProcessedImage(response.data.processed_image);
      setBoundingBoxes(response.data.bounding_boxes);
      setOcrText(response.data.ocr_text);
      setAudioUrl(response.data.audio_url);
      toast.success("✔ ประมวลผลเสร็จสิ้น!", { id: "processing" });
      setProcessingComplete(true);
    } catch (error) {
      toast.error("📌 ไม่สามารถสร้างพาโนรามาได้ กรุณาถ่ายใหม่!", { id: "processing" });
    }

    setLoading(false);
  };

  // ✅ ตรวจจับการกดปุ่ม
  const bind = useGesture({
    onPointerDown: () => {
      if (loading) return; // ❌ ป้องกันกดซ้ำ

      pressStartTime.current = Date.now();

      // ตั้งเวลา ถ้ากดค้างเกิน 500ms จะเริ่มถ่ายพาโนรามา
      pressTimeoutRef.current = setTimeout(() => {
        startPanoramaCapture();
      }, 500);
    },
    onPointerUp: async () => {
      clearTimeout(pressTimeoutRef.current); // ✅ ล้าง timeout ป้องกันถ่ายพาโนรามาผิดพลาด

      if (captureIntervalRef.current) {
        await stopPanoramaCapture(); // ✅ หยุดการถ่ายพาโนรามาเมื่อปล่อยนิ้ว
      } else {
        await handleSingleCapture(); // ✅ ถ่ายภาพปกติ
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <Toaster position="top-center" reverseOrder={false} /> {/* ✅ Hot Toast */}

      <h1 className="text-2xl font-bold mb-6">📸 ระบบถ่ายภาพ</h1>
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
