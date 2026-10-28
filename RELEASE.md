# Version 0.3.0 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Neues, einheitliches Aussehen: ruhiges Anthrazit im Dunkelmodus, angenehmes Weiß und Hellgrau im Hellmodus. Der Standard-Akzent ist jetzt Rot. Die Akzentfarbe lässt sich weiterhin in den Theme-Einstellungen wählen (auch eine eigene Farbe).
- Rot gibt es nur bei bedienbaren Dingen: Der Kaufen-Button ist die eine Hauptaktion. Alle anderen Buttons sind neutral umrandet.
- Produktkarten haben einen feinen Rahmen und springen beim Darüberfahren nicht mehr. Preise sind fett und in Textfarbe, der Streichpreis ist grau und durchgestrichen. Das Sale-Siegel ist hell getönt mit Text, nicht mehr knallrot (im Dunkelmodus war weiße Schrift auf Rot schwer lesbar).
- Kopfzeile: Logo links, Suche in der Mitte, Konto, Warenkorb und Glocke rechts, Menü in der zweiten Zeile. Fußzeile, Hinweise, Formulare, Seitenzahlen und Warenkorb passen jetzt zum neuen Aussehen. Fehlermeldungen tragen das Wort "Fehler:", ein Symbol und einen Rand.
- Fehler behoben: Der Hell/Dunkel-Umschalter und der Bereich "Vertrauens-Hinweise" im Footer wurden in Shopware 6.7 (und 6.6) nie angezeigt, weil sie in einem Block standen, den es nicht gibt. Beides erscheint jetzt (Umschalter in der Kopfzeile, wenn in den Einstellungen an).
- Der Hell/Dunkel-Umschalter speichert die Wahl nur, wenn Besucher selbst umschalten.
- Die Ankündigungsleiste hat keinen vorgegebenen Text mehr (vorher "Kostenloser Versand ab 50 €"). Bitte nur eintragen, was wirklich stimmt.
- Neue Plugin-Symbole und neues Vorschaubild im Theme-Manager.

## Bitte beachten

- Wer schon "Indigo" oder eine andere Akzentfarbe gespeichert hat, behält sie. Nur neue Installationen starten mit Rot. Zum Ändern: Theme-Einstellungen, Akzentfarbe.
- Nach dem Update `bin/console theme:compile` und `bin/console cache:clear` ausführen.
- Kasse und Konto sehen nach dem Standard von Shopware aus, nur Farben, Rahmen und Buttons folgen dem neuen Aussehen.

## Noch nicht fertig

- Die Glocke wurde im Demo-Shop mit Shopware 6.7.15.1 getestet. Shopware 6.6 wurde nicht getestet (die Vorlagen-Blöcke wurden gegen den Quelltext von 6.6.10.0 geprüft).
- Der optionale GitHub-Updater ist standardmäßig aus. Diese Version bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update- oder Installations-Schritt ausführen.
3. Theme dem Verkaufskanal zuweisen und `bin/console theme:compile` ausführen. Danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
