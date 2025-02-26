import os
import uuid
from gtts import gTTS
from config import AUDIO_FOLDER

def text_to_speech(text, lang='th'):
    audio_filename = f"audio_{uuid.uuid4()}.mp3"
    audio_path = os.path.join(AUDIO_FOLDER, audio_filename)

    tts = gTTS(text, lang=lang)
    tts.save(audio_path)

    return audio_filename
