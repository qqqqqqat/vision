export default function AudioPlayer({ audioUrl }) {
    return (
      <div className="mt-4">
        <h2 className="text-xl font-semibold">🔊 เสียงอ่านข้อความ:</h2>
        <audio controls src={audioUrl} className="mt-2"></audio>
      </div>
    );
  }
  