# Version 0.2.3 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Rechtliche Hilfen im Shop: Preishinweis mit Link zu den Versandkosten, Hinweis zur Gewährleistung, Produktsicherheit (GPSR) aus Custom Fields, Kennzeichnung "Ausverkauft", Links zur Widerrufs-Seite und zur Barrierefreiheitserklärung sowie Videos, die erst nach einem Klick geladen werden. Alle Texte sind Vorschläge und keine Rechtsberatung.
- Dunkelmodus besser lesbar: Überschriften, Brotkrumen-Links und Cookie-Leiste haben mehr Kontrast.
- "Eigene Akzentfarbe" ist jetzt standardmäßig leer. Vorher hat sie die gewählte Akzentfarbe immer überschrieben.
- Eingebettete Videos bekommen immer einen Titel für Screenreader (Barrierefreiheit).
- Der niedrigste Preis der letzten 30 Tage und die Lieferzeit kommen von Shopware selbst. Das Theme blendet sie nicht aus. Mehr dazu in `docs/INSTALL.md`.

## Noch nicht fertig

- Das Benachrichtigungs-Center (Glocke) ist nur vorbereitet und im Shop noch ausgeschaltet, weil die Anzeige in Shopware 6.7 noch nicht läuft. Im Hintergrund legt das Theme schon Datenbank-Tabellen an und speichert bei Produkt- und Bestelländerungen Meldungen, die noch niemand sieht.
- Der optionale GitHub-Updater ist standardmäßig aus. Diese Version bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update- oder Installations-Schritt ausführen.
3. Theme dem Verkaufskanal zuweisen und `bin/console theme:compile` ausführen. Danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
