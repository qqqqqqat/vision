from gtts import gTTS
import uuid
from config import AUDIO_FOLDER

# แปลงข้อความเป็นไฟล์เสียง
def text_to_speech(text, lang='th'):
    filename = f"{AUDIO_FOLDER}/audio_{uuid.uuid4()}.mp3"
    tts = gTTS(text, lang=lang)
    tts.save(filename)
    return filename
