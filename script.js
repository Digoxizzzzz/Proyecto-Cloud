const button = document.getElementById("start-record");
const output = document.getElementById("output");
const translated = document.getElementById("translated");

button.addEventListener("click", async () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "es-ES";

    recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        output.textContent = `Texto detectado: ${text}`;

        // Llamar a la API de Azure Functions para traducir
        const response = await fetch("/api/translate_function", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        translated.textContent = `Traducción: ${data.translated}`;
    };

    recognition.start();
});
