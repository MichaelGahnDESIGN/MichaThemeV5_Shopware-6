# Version 0.2.4 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Die Glocke (Benachrichtigungs-Center) funktioniert wieder in Shopware 6.6 und 6.7. Sie steht bei Konto und Warenkorb in der Kopfzeile und unten im Footer.
- Eingeloggte Kunden sehen dort ihre eigenen Meldungen zu Bestellungen. Die rote Zahl zeigt, was noch ungelesen ist. Dafür wird nichts im Browser gespeichert.
- Was repariert wurde: Die Adressen der Glocke werden jetzt geladen, das Skript liegt fertig im Paket (kein Node-Build nötig) und die Meldungen sind auf das Nötige begrenzt (keine Kunden-IDs, keine Fehler-Details, nur sichere Links).
- Neue Einstellungen unter "Benachrichtigungs-Center (Glocke)": Die Glocke lässt sich ausschalten (dann werden auch keine neuen Meldungen gespeichert). "Produkt aktualisiert" als öffentliche Meldung ist standardmäßig aus.
- Fehler behoben: Der Produkt-Teil der Meldungs-Funktion war falsch verdrahtet (ein Wert fehlte) und hätte beim Speichern von Produkten einen Fehler auslösen können. Außerdem können Meldungen das Speichern von Produkten und Bestellungen jetzt nicht mehr stören.
- Neu: Datei `LICENSE` und ein Abschnitt "Lizenz" in der README. Das ist keine Rechtsberatung; die Lizenzfrage wird noch rechtlich geprüft.

## Noch nicht fertig

- Öffentliche Meldungen für alle Besucher lassen sich bisher nur über die Admin-API anlegen. Eine fertige Oberfläche im Admin gibt es noch nicht (siehe `docs/INSTALL.md`).
- Die Glocke wurde im Demo-Shop mit Shopware 6.7.15.1 getestet. Shopware 6.6 wurde nicht getestet.
- Der optionale GitHub-Updater ist standardmäßig aus. Diese Version bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update- oder Installations-Schritt ausführen.
3. Theme dem Verkaufskanal zuweisen und `bin/console theme:compile` ausführen. Danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
