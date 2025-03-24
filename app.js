// Replace with your Azure keys from the portal
const speechKey = '1F7wpHWf5e3Ko47lSVZolnH2thAFRjxhGaYs4lV2qn84QhRcsfooJQQJ99BCACYeBjFXJ3w3AAAYACOGnRZc';
const speechRegion = 'eastus';
const translatorKey = '1DMdVyQlGCVhE7c6HyoGpb5l0GBc7Z1TcEJ0FVUYop2OlVtF93t7JQQJ99BCACYeBjFXJ3w3AAAbACOG1cT7';
const translatorRegion = 'eastus';

let recognizer;
let audioContext;
let isProcessing = false;

// UI Elements
const statusMessage = document.getElementById('statusMessage');
const progressBar = document.getElementById('progressBar');
const recordingStatus = document.getElementById('recordingStatus');

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.backgroundColor = type === 'error' ? '#fdecea' : '#e8f5e9';
    statusMessage.style.color = type === 'error' ? '#c62828' : '#2e7d32';
    
    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
}

function updateProgress(percentage) {
    progressBar.style.width = `${percentage}%`;
}

document.getElementById('startRecord').addEventListener('click', async () => {
    try {
        document.getElementById('startRecord').disabled = true;
        document.getElementById('stopRecord').disabled = false;
        recordingStatus.style.display = 'flex';
        showStatus('Initializing microphone...');
        updateProgress(10);
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
        
        recognizer.recognizing = (s, e) => {
            if (!isProcessing) {
                document.getElementById('originalText').textContent = e.result.text;
                updateProgress(30);
            }
        };
        
        recognizer.recognized = (s, e) => {
            if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                isProcessing = true;
                document.getElementById('originalText').textContent = e.result.text;
                updateProgress(50);
                showStatus('Translating speech...');
                translateText(e.result.text);
            }
        };
        
        recognizer.canceled = (s, e) => {
            if (e.reason === SpeechSDK.CancellationReason.Error) {
                showStatus(`Error: ${e.errorDetails}`, 'error');
                resetUI();
            }
        };
        
        await recognizer.startContinuousRecognitionAsync();
        showStatus('Recording started. Speak now...');
        updateProgress(20);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        resetUI();
    }
});

document.getElementById('stopRecord').addEventListener('click', async () => {
    try {
        showStatus('Stopping recording...');
        await recognizer.stopContinuousRecognitionAsync();
        showStatus('Recording stopped');
        resetUI();
        updateProgress(0);
    } catch (error) {
        showStatus(`Error stopping recording: ${error.message}`, 'error');
    }
});

document.getElementById('playTranslation').addEventListener('click', () => {
    const translatedText = document.getElementById('translatedText').textContent;
    if (translatedText && translatedText !== 'Translation will appear here...') {
        showStatus('Playing translation...');
        updateProgress(90);
        textToSpeech(translatedText, document.getElementById('targetLanguage').value);
    } else {
        showStatus('No translation available to play', 'error');
    }
});

async function translateText(text) {
    if (!text.trim()) {
        showStatus('No text to translate', 'error');
        isProcessing = false;
        return;
    }
    
    const targetLanguage = document.getElementById('targetLanguage').value;
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}`;
    
    try {
        updateProgress(60);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': translatorKey,
                'Ocp-Apim-Subscription-Region': translatorRegion,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ Text: text }])
        });
        
        if (!response.ok) {
            throw new Error(`Translation failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const translatedText = data[0].translations[0].text;
        document.getElementById('translatedText').textContent = translatedText;
        showStatus('Translation complete!');
        updateProgress(80);
        isProcessing = false;
    } catch (error) {
        console.error('Translation error:', error);
        showStatus(`Translation error: ${error.message}`, 'error');
        isProcessing = false;
        updateProgress(0);
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
                showStatus('Playback completed');
                updateProgress(100);
                setTimeout(() => updateProgress(0), 1000);
                synthesizer.close();
            }
        },
        error => {
            console.error(error);
            showStatus(`Playback error: ${error}`, 'error');
            updateProgress(0);
            synthesizer.close();
        }
    );
}

function resetUI() {
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;
    recordingStatus.style.display = 'none';
    isProcessing = false;
}

// Load the Speech SDK
const script = document.createElement('script');
script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw';
script.onload = () => {
    showStatus('Speech SDK loaded successfully. Ready to record!');
};
script.onerror = () => {
    showStatus('Failed to load Speech SDK', 'error');
};
document.head.appendChild(script);
