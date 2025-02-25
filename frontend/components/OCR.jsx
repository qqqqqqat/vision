export default function OCRText({ text }) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold">🔍 ข้อความจาก OCR:</h2>
        <p className="p-4 bg-gray-800 rounded-lg shadow">{text}</p>
      </div>
    );
  }
  