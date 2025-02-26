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

def google_ocr_with_boxes(image):
    client = vision.ImageAnnotatorClient()
    
    image_pil = Image.fromarray(image)
    image_width, image_height = image_pil.size  

    with io.BytesIO() as output:
        image_pil.save(output, format="JPEG")
        content = output.getvalue()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations

    results = []
    if texts:
        for text in texts[1:]:
            if not hasattr(text, "description") or not hasattr(text, "bounding_poly"):
                continue

            box = [
                {
                    "x": int(vertex.x * (1920 / image_width)),
                    "y": int(vertex.y * (1080 / image_height))
                }
                for vertex in text.bounding_poly.vertices
            ]
            results.append({"text": text.description, "box": box})
    return results

