from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Modell und Tokenizer laden
model_name = "gpt2"  # Du kannst auch kleinere Modelle wie "distilgpt2" verwenden
model = GPT2LMHeadModel.from_pretrained(model_name)
tokenizer = GPT2Tokenizer.from_pretrained(model_name)

# Eingabeaufforderung
prompt = "What was the first Bitcoin real-life transaction?"

# Tokenisieren
inputs = tokenizer.encode(prompt, return_tensors="pt")

# Text generieren (mehr Tokens, ohne feste Begrenzung)
max_length = 1000  # Du kannst eine beliebige maximale Länge festlegen

# Text generieren, indem du mehrere Sequenzen erzeugst
outputs = model.generate(
    inputs,
    max_length=max_length,  # Maximale Länge
    num_return_sequences=1,
    no_repeat_ngram_size=2,  # Verhindert die Wiederholung von n-Grammen
    pad_token_id=tokenizer.eos_token_id,  # Sorgt dafür, dass das Modell mit einem speziellen Token endet
    temperature=0.7,  # Bestimmt die Zufälligkeit der Antwort
    top_p=0.9,  # Top-p Sampling für Vielfalt
    top_k=50  # Begrenzung der Top-K Kandidaten
)

# Entschlüsselung und Ausgabe
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
