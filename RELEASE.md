# Version 0.5.3 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Neu: Kartenstil, Flächenstil (Glas) und Inhaltsbreite einstellbar, auch über die Presets „Glas“ und „Kompakt“.
- Korrigiert: Das Plugin blendet sich in den Plugin-Empfehlungen selbst aus.

- Korrigiert: Das Admin-Modul aus 0.5.1 fand sein Schema nicht. Mit 0.5.2 laden Einstellungen, Lizenz und Info.

- Neues Admin-Modul: Einstellungen, Lizenzen, Plugin-Empfehlungen und Info an einem Ort (Einstellungen, Erweiterungen, MichaThemeV5).
- 16 eigene Farben für Hell und Dunkel mit Farbwähler, Palette und Warnung bei schlecht lesbarem Text.
- Design-Presets (Standard, Glas, Kompakt), Suche, „Einfach“ und „Experte“.
- Lizenzcode einfügen und prüfen. Der Code wird nie im Klartext angezeigt.
- Alle Werte bleiben in der normalen Theme-Konfiguration. Nichts geht verloren.

## Noch nicht fertig

- Das Admin-Modul wurde nicht in jeder Shopware-Version getestet (6.7.15.1 ja, 6.6 nein).
- Hell/Dunkel-Schalter im Benutzerkonto: Gäste ohne Konto sehen ihn dort nicht.
- Auf Produktkarten liegen das Herz der Wunschliste (Shopware) und das Herz der Favoriten (Theme) nebeneinander.
- Der optionale GitHub-Updater ist standardmäßig aus. Bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update-Schritt ausführen.
3. `bin/console theme:compile` ausführen, danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
