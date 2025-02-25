from google.cloud import vision
from PIL import Image
import io

# OCR ใช้ Google Vision API
def google_ocr(image):
    client = vision.ImageAnnotatorClient()
    image_pil = Image.fromarray(image)
    
    with io.BytesIO() as output:
        image_pil.save(output, format="JPEG")
        content = output.getvalue()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations

    return texts[0].description if texts else ""

# OCR พร้อม Bounding Box
def google_ocr_with_boxes(image):
    client = vision.ImageAnnotatorClient()
    image_pil = Image.fromarray(image)

    with io.BytesIO() as output:
        image_pil.save(output, format="JPEG")
        content = output.getvalue()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations

    results = []
    if texts:
        for text in texts[1:]:  # ข้ามข้อความรวมทั้งหมด (texts[0])
            box = [{"x": v.x, "y": v.y} for v in text.bounding_poly.vertices]
            results.append({"text": text.description, "box": box})
    
    return results
