import axios from "axios";

const API_BASE_URL = "http://192.168.35.43:8000/api";

export const captureImage = async (imageSrc) => {
  const formData = new FormData();
  formData.append("file", dataURLtoBlob(imageSrc), "capture.jpg");

  return await axios.post(`${API_BASE_URL}/capture`, formData);
};

export const captureSingleImage = async (imageSrc) => {
  const formData = new FormData();
  formData.append("file", dataURLtoBlob(imageSrc), "single_capture.jpg");

  return await axios.post(`${API_BASE_URL}/capture_single`, formData);
};

export const processImage = async () => {
  return await axios.post(`${API_BASE_URL}/process_image`);
};

// Helper function to convert DataURL to Blob
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
