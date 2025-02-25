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
  const [processedImage, setProcessedImage] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const pressStartTime = useRef(null);
  const webcamRef = useRef(null);

  // Function สำหรับกดถ่ายภาพปกติ
  const handleSingleCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const response = await captureSingleImage(imageSrc);
        setProcessedImage(`http://192.168.35.43:8000${response.data.processed_image}`);
        setBoundingBoxes(response.data.bounding_boxes);
        setOcrText(response.data.ocr_text);
        setAudioUrl(`http://192.168.35.43:8000${response.data.audio_url}`);
      } else {
        console.error("ไม่สามารถจับภาพได้");
      }
    } else {
      console.error("Webcam ยังไม่ถูกโหลดสมบูรณ์");
    }
  };
  

  // Function สำหรับการถ่ายพาโนรามา
  const handlePanoramaCapture = async () => {
    setCapturing(false);
    setLoading(true);
    const response = await processImage();
    setProcessedImage(`http://192.168.35.43:8000${response.data.processed_image}`);
    setBoundingBoxes(response.data.bounding_boxes);
    setOcrText(response.data.ocr_text);
    setAudioUrl(`http://192.168.35.43:8000${response.data.audio_url}`);
    setLoading(false);
  };

  // ตรวจจับการกดปุ่มและปล่อย
  const bind = useGesture({
    onPointerDown: () => {
      pressStartTime.current = Date.now();
      setCapturing(true);
    },
    onPointerUp: async () => {
      const pressDuration = Date.now() - pressStartTime.current;
      setCapturing(false);

      if (pressDuration < 300) {
        // ถ่ายภาพปกติ
        setLoading(true);
        await handleSingleCapture();
        setLoading(false);
      } else {
        // ถ่ายภาพพาโนรามา
        setLoading(true);
        await handlePanoramaCapture();
        setLoading(false);
      }
    },
  });

  return (
    <div data-theme="dark" className="min-h-screen bg-base-200 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">📸 ระบบถ่ายภาพ</h1>

      <Camera capturing={capturing} webcamRef={webcamRef} />
      {loading && <ProgressBar />}
      <CaptureButton bind={bind} capturing={capturing} />
      {processedImage && <ProcessedImage processedImage={processedImage} boundingBoxes={boundingBoxes} />}
      {ocrText && <OCRText text={ocrText} />}
      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </div>
  );
}
