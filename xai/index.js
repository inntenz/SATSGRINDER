const axios = require('axios');
const cheerio = require('cheerio');
const langdetect = require('langdetect');
const readline = require('readline');

// Erstelle ein Interface für Benutzereingaben
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funktion zum Scrapen von Informationen aus Wikipedia
async function scrapeFromWikipedia(query) {
  const url = `https://de.wikipedia.org/wiki/${encodeURIComponent(query)}`;
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extrahiere den ersten Abschnitt des Artikels
    const firstParagraph = $('#mp-upper p').first().text();
    return firstParagraph || $('p').first().text();
  } catch (error) {
    console.error('Fehler beim Scraping von Wikipedia:', error);
    return null;
  }
}

// Funktion zum Erkennen der Sprache
function detectLanguage(text) {
  const detectedLanguage = langdetect.detect(text)[0][0];
  return detectedLanguage;  // Gibt den Sprachnamen zurück (z.B. 'en' oder 'de')
}

// Funktion zum Umgestalten der Antwort
function transformSentence(sentence) {
  const transformations = [
    { original: 'und', replacement: 'sowie' },
    { original: 'also', replacement: 'demnach' },
    { original: 'der schnellste', replacement: 'am schnellsten fliegende' },
    { original: 'der größte', replacement: 'der mächtigste' },
    { original: 'im Jahr', replacement: 'im Jahre' },
    // Weitere einfache Transformationen hinzufügen
  ];

  let modifiedSentence = sentence;

  // Ersetze Wörter und Strukturen
  transformations.forEach(({ original, replacement }) => {
    modifiedSentence = modifiedSentence.replace(new RegExp(`\\b${original}\\b`, 'g'), replacement);
  });

  // Umstrukturierung des Satzes: Mische die Satzteile (umstellen)
  const sentences = modifiedSentence.split('. ');
  if (sentences.length > 1) {
    // Tausche die Reihenfolge von zwei zufälligen Sätzen
    const [first, second, ...rest] = sentences;
    modifiedSentence = [second, first, ...rest].join('. ');
  }

  return modifiedSentence;
}

// Funktion, um die Antwort zu erhalten und in der gewünschten Sprache auszugeben
async function getAnswer(query, lang) {
  // Scrape Daten von Wikipedia
  let scrapedData = await scrapeFromWikipedia(query);
  
  if (!scrapedData) {
    console.log("Keine Daten gefunden.");
    return;
  }

  // Umgestalte die Antwort
  const transformedAnswer = transformSentence(scrapedData);

  // Ausgabe der Antwort in der gewünschten Sprache
  if (lang === 'de') {
    console.log(`Antwort auf die Frage "${query}" in Deutsch:`);
    console.log(transformedAnswer);
  } else if (lang === 'en') {
    console.log(`Answer to the question "${query}" in English:`);
    console.log(transformedAnswer);
  } else {
    console.log("Sprache nicht erkannt oder unterstützt.");
  }
}

// Benutzereingabe und Verarbeitung
rl.question('Stelle eine Frage: ', async (question) => {
  const detectedLang = detectLanguage(question); // Erkenne die Sprache der Frage
  console.log(`Erkannte Sprache: ${detectedLang}`);

  rl.question('In welcher Sprache möchtest du die Antwort (de/en)? ', async (lang) => {
    await getAnswer(question, lang);
    rl.close();
  });
});
