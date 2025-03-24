import os
import requests
import azure.cognitiveservices.speech as speechsdk
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Configuración de Azure AI Services
azure_ai_key = os.getenv("10wPxJg2jKSu7YqWaf7iKLehdVZQxqcECH5ZXhfXK5abt0igUtQJJQQJ99BCACYeBjFXJ3w3AAAAACOGpgXB")
azure_ai_endpoint = os.getenv("https://speechtotext-translation.openai.azure.com/")
azure_ai_region = os.getenv("eastus")

def speech_to_text(audio_file_path):
    """Convierte audio en texto usando Azure AI Services (Speech to Text)."""
    speech_config = speechsdk.SpeechConfig(subscription=azure_ai_key, region=azure_ai_region)
    audio_input = speechsdk.audio.AudioConfig(filename=audio_file_path)
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_input)

    result = speech_recognizer.recognize_once()
    return result.text if result.reason == speechsdk.ResultReason.RecognizedSpeech else None

def translate_text(text, target_language):
    """Traduce texto usando Azure AI Services (Translator)."""
    url = f"{azure_ai_endpoint}/translator/text/v3.0/translate"
    headers = {
        'Ocp-Apim-Subscription-Key': azure_ai_key,
        'Ocp-Apim-Subscription-Region': azure_ai_region,
        'Content-Type': 'application/json'
    }
    params = {'api-version': '3.0', 'to': target_language}
    body = [{'text': text}]
    
    response = requests.post(url, headers=headers, params=params, json=body)
    if response.status_code == 200:
        return response.json()[0]['translations'][0]['text']
    return None

def text_to_speech(text, output_file_path, language_voice):
    """Convierte texto en audio usando Azure AI Services (Text to Speech)."""
    speech_config = speechsdk.SpeechConfig(subscription=azure_ai_key, region=azure_ai_region)
    speech_config.speech_synthesis_voice_name = language_voice
    audio_config = speechsdk.audio.AudioOutputConfig(filename=output_file_path)
    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

    speech_synthesizer.speak_text_async(text).get()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No se proporcionó un archivo de audio"}), 400
    audio_file = request.files['audio']
    audio_file_path = "input_audio.wav"
    audio_file.save(audio_file_path)

    text = speech_to_text(audio_file_path)
    if not text:
        return jsonify({"error": "No se pudo convertir el audio a texto"}), 400

    target_language = request.form.get('language', 'en')
    language_voice = request.form.get('voice', 'en-US-AriaNeural')
    translated_text = translate_text(text, target_language)

    if not translated_text:
        return jsonify({"error": "No se pudo traducir el texto"}), 400

    output_audio_path = "translated_audio.wav"
    text_to_speech(translated_text, output_audio_path, language_voice)

    return jsonify({
        "original_text": text,
        "translated_text": translated_text,
        "audio_file": output_audio_path
    })

if __name__ == '__main__':
    app.run(debug=True)
