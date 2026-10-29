# Änderungen

## Version 0.5.3

- Neu: Drei Layout-Einstellungen in der Gruppe „Form und Stil“: **Kartenstil** (flach, mit Rahmen, mit Schatten), **Flächenstil** (einfarbig oder Glas) und **Inhaltsbreite** (schmal, normal, breit). „Normal“ sieht aus wie bisher.
- Glas ist halbtransparent mit Weichzeichner (Kopfzeile, Produktkarten, Warenkorb-Karten, Ankündigungsleiste). Bei älteren Browsern und bei der Systemeinstellung „Transparenz reduzieren“ bleiben die Flächen einfarbig. Der Text bleibt gut lesbar (mindestens 4,5 zu 1).
- Die Presets „Glas“ und „Kompakt“ setzen jetzt alles, was ihr Name verspricht.
- Korrigiert: Das Plugin blendet sich in den Plugin-Empfehlungen jetzt selbst aus (die Katalog-ID war falsch geschrieben).

## Version 0.5.2

- Korrigiert: Das Admin-Modul fand sein Einstellungs-Schema nicht (falscher Pfad). Jetzt lädt es die Einstellungen, die Lizenz-Seite und die Info-Seite.
- Kleinigkeit: Eine unnötige PHP-8.5-Warnung beim Laden der Plugin-Empfehlungen entfernt.

## Version 0.5.1

- Neu: Admin-Modul im Shopware-Admin unter Einstellungen, Erweiterungen, MichaThemeV5 mit vier Seiten: Einstellungen, Lizenzen, Plugin-Empfehlungen, Info.
- Einstellungen: Design-Presets (Standard, Glas, Kompakt), Suche, Umschalter „Einfach“ und „Experte“, Filter „Nur geänderte“, Zurücksetzen je Feld, Warnung bei ungespeicherten Änderungen.
- Neu: 16 eigene Farben getrennt für Hell und Dunkel mit Farbwähler, Palette für 12 Farben und Kontrast-Warnung. Leer heißt Standardfarbe.
- Lizenzen: Code einfügen, Status, „Jetzt prüfen“, Link zum Kauf. Der Code wird nie im Klartext angezeigt.
- Plugin-Empfehlungen aus dem Katalog von theme.michael-gahn.de (zwischengespeichert, bei Fehlern still).
- Gespeichert wird in der normalen Theme-Konfiguration (gleiche Schlüssel wie bisher). Nichts muss umgezogen werden.
- Rechte „MichaThemeV5 ansehen“ und „bearbeiten“ für Benutzerrollen. Texte auf Deutsch und Englisch.
- Das Admin-Skript liegt fertig im Paket. Ein Build im Shop ist nicht nötig.
- Das Theme übernimmt den aktuellen Stand des Kerns (Link- und Ankündigungsleisten-Farben).
- Noch nicht auf Shopware: Glas-Fläche, Kartenstil und Inhaltsbreite aus den Presets (kommen mit einem späteren Theme-Update).

## Version 0.4.1

- Korrigiert: Der Zähl-Text der Favoriten stimmt in der Einzahl.
- Doku für Icon-Leiste und Farben.
