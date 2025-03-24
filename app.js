// Replace with your Azure keys from the portal
const speechKey = '1F7wpHWf5e3Ko47lSVZolnH2thAFRjxhGaYs4lV2qn84QhRcsfooJQQJ99BCACYeBjFXJ3w3AAAYACOGnRZc';
const speechRegion = 'eastus';
const translatorKey = '1DMdVyQlGCVhE7c6HyoGpb5l0GBc7Z1TcEJ0FVUYop2OlVtF93t7JQQJ99BCACYeBjFXJ3w3AAAbACOG1cT7';
const translatorRegion = 'eastus';

let recognizer;
let audioContext;

document.getElementById('startRecord').addEventListener('click', async () => {
    document.getElementById('startRecord').disabled = true;
    document.getElementById('stopRecord').disabled = false;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'en-US';
    
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    
    recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            document.getElementById('originalText').textContent = e.result.text;
            translateText(e.result.text);
        }
    };
    
    recognizer.startContinuousRecognitionAsync();
});

document.getElementById('stopRecord').addEventListener('click', () => {
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;
    
    recognizer.stopContinuousRecognitionAsync();
});

document.getElementById('playTranslation').addEventListener('click', () => {
    const translatedText = document.getElementById('translatedText').textContent;
    if (translatedText) {
        textToSpeech(translatedText, document.getElementById('targetLanguage').value);
    }
});

async function translateText(text) {
    const targetLanguage = document.getElementById('targetLanguage').value;
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': translatorKey,
                'Ocp-Apim-Subscription-Region': translatorRegion,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ Text: text }])
        });
        
        const data = await response.json();
        const translatedText = data[0].translations[0].text;
        document.getElementById('translatedText').textContent = translatedText;
    } catch (error) {
        console.error('Translation error:', error);
    }
}

function textToSpeech(text, language) {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechSynthesisLanguage = language;
    
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizer.speakTextAsync(
        text,
        result => {
            if (result) {
                synthesizer.close();
            }
        },
        error => {
            console.error(error);
            synthesizer.close();
        }
    );
}

// Load the Speech SDK
const script = document.createElement('script');
script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
document.head.appendChild(script);