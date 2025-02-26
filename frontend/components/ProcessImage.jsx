export default function ProcessedImage({ processedImage, boundingBoxes }) {
  return (
    <div className="relative w-full max-w-2xl mt-4">
      <img src={processedImage} alt="Processed" className="rounded-lg shadow-lg w-full" />
      {boundingBoxes.map((box, index) => {
        const style = {
          position: "absolute",
          top: `${(box.box[0].y / 1080) * 100}%`,  // ปรับขนาดตามอัตราส่วนภาพ
          left: `${(box.box[0].x / 1920) * 100}%`,
          width: `${((box.box[2].x - box.box[0].x) / 1920) * 100}%`,
          height: `${((box.box[2].y - box.box[0].y) / 1080) * 100}%`,
          border: "1px solid green",
          borderRadius: "1px",
          boxShadow: "0 0 5px rgba(0, 255, 0, 0.7)",
        };
        return <div key={index} style={style}></div>;
      })}
    </div>
  );
}
