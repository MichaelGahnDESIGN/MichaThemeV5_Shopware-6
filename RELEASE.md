# Version 0.3.1 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Link-Farbe beim Darüberfahren ist jetzt im Dunkelmodus gut lesbar (gleiche Regel wie im gemeinsamen Kern).
- Keine erfundenen Standardtexte mehr: Die Ankündigungsleiste hat keinen vorgegebenen Text.
- Prozent-Siegel und Countdown sind standardmäßig aus (nur Pro-Funktionen, im Free-Theme ohne Wirkung).

## Noch nicht fertig

- Shopware 6.6 wurde nicht live getestet (Vorlagen-Blöcke sind gegen 6.6.10.0 geprüft).
- Der optionale GitHub-Updater ist standardmäßig aus. Bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update-Schritt ausführen.
3. `bin/console theme:compile` ausführen, danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
