export default function ProgressBar() {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-lg">
        <progress className="progress progress-accent w-3/4 mb-4" value="100" max="100"></progress>
        <p className="text-lg font-semibold">🔄 กำลังประมวลผลภาพ กรุณารอสักครู่...</p>
      </div>
    );
  }
  