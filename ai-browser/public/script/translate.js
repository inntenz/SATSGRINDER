document.getElementById("translateBtn").addEventListener("click", async () => {
    const text = document.getElementById("inputText").value;
    const to = document.getElementById("languageSelect").value;
    const translatedText = document.getElementById("outputText");
    const detectedLangSpan = document.getElementById("detectedLanguage");

    if (!text) return;

    try {
        // Sprache automatisch erkennen
        const detectRes = await fetch("/api/intenz/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const detectData = await detectRes.json();
        
        const from = detectData.language || "en";
        
        detectedLangSpan.textContent = `${from}`;

        const translateRes = await fetch("/api/intenz/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                user: "demo",
                countryCode: to
            })
        });

        const translateData = await translateRes.json();
        translatedText.textContent = translateData.translation || "Übersetzung fehlgeschlagen.";
    } catch (error) {

    }
});

document.getElementById("copyBtn").addEventListener("click", async () => {
    const translatedText = document.getElementById("outputText").textContent;

    try {
        await navigator.clipboard.writeText(translatedText);
        
    } catch (err) {
        console.error("Kopieren fehlgeschlagen:", err);
        
    }
});
