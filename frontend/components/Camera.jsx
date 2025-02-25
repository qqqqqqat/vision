import Webcam from "react-webcam";

export default function Camera({ capturing, webcamRef }) {
  return (
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

      {/* กรอบแสดงระหว่างถ่ายภาพ */}
      {capturing && (
        <div
          className="absolute border-4 border-white rounded-lg"
          style={{
            top: "25%",
            left: "25%",
            width: "50%",
            height: "50%",
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.7)",
          }}
        />
      )}
    </div>
  );
}
