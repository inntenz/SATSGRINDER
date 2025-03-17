// Funktion zum Anzeigen der Benachrichtigung
function showNotification(type, message) {
    // Benachrichtigungselement erstellen
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Benachrichtigung in den Body einfügen
    document.body.appendChild(notification);

    // Benachrichtigung sichtbar machen
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Benachrichtigung nach 5 Sekunden entfernen
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500); // Element aus DOM entfernen
    }, 5000);
}
