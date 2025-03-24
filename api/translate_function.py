import azure.functions as func
import json
import requests
import os

def main(req: func.HttpRequest) -> func.HttpResponse:
    body = req.get_json()
    text = body.get("text")

    # Speech to Text ya está en el frontend, ahora usamos OpenAI para traducir
    openai_key = os.getenv("2YArxDEVTZVRwiAxoMjGh9LEJNgiLfEfTnay7IxWmaQF9nsHvU5PJQQJ99BCACYeBjFXJ3w3AAAAACOGWXCi")
    openai_endpoint = "https://speech-service-demostracion.openai.azure.com/"

    headers = {
        'Authorization': f'Bearer {openai_key}',
        'Content-Type': 'application/json'
    }
    data = {
        "messages": [{"role": "system", "content": "Traduce al inglés."}, {"role": "user", "content": text}],
        "max_tokens": 100
    }
    
    response = requests.post(openai_endpoint, headers=headers, json=data)
    translation = response.json()["choices"][0]["message"]["content"]

    return func.HttpResponse(json.dumps({"translated": translation}), mimetype="application/json")
