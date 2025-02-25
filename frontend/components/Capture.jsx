export default function CaptureButton({ bind, capturing }) {
    return (
      <button
        {...bind()}
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border-4 border-gray-300 w-20 h-20 flex items-center justify-center ${
          capturing ? "scale-90 bg-red-500" : ""
        } transition-transform duration-200 ease-in-out`}
      >
        <div
          className={`w-12 h-12 rounded-full ${capturing ? "bg-red-600" : "bg-white"}`}
        ></div>
      </button>
    );
  }
  