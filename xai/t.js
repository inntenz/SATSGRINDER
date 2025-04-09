const tf = require('@tensorflow/tfjs');

// Beispiel: Textdaten (hier für die Demonstration)
const texts = [
  "Max Verstappen ist ein talentierter Fahrer, der 2021 den Formel-1-Weltmeistertitel gewann.",
  "Tesla ist ein führendes Unternehmen im Bereich Elektroautos und erneuerbare Energien.",
  "JavaScript ist eine der beliebtesten Programmiersprachen der Welt."
];

// Labels: Die Kategorien, in die die Texte eingeteilt werden
const labels = ["Formel 1", "Technologie", "Programmierung"];

// Text in numerische Daten umwandeln (Tokenisierung und Vektorisierung)
const vectorizeText = (text) => {
  const charCodes = Array.from(text).map(c => c.charCodeAt(0));
  return tf.tensor2d([charCodes], [1, charCodes.length]);
};

// Vorverarbeitung der Daten
const xs = tf.stack(texts.map(text => vectorizeText(text)));
const ys = tf.tensor2d([
  [1, 0, 0],  // Formel 1
  [0, 1, 0],  // Technologie
  [0, 0, 1]   // Programmierung
]);

// Ein einfaches Modell erstellen
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [xs.shape[1]] }));
model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));  // Drei Ausgänge für die Kategorien

model.compile({
  optimizer: 'adam',
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

// Modell trainieren
model.fit(xs, ys, {
  epochs: 10,
  batchSize: 1
}).then(() => {
  console.log('Modell trainiert!');

  // Vorhersage für neuen Text
  const newText = "Max Verstappen fährt für Red Bull Racing in der Formel 1.";
  const inputTensor = vectorizeText(newText);

  model.predict(inputTensor).print();
});
