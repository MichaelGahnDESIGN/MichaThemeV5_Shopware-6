# Änderungen

## Version 0.6.2

- Neu Glocke: In den Plugin-Einstellungen „Anzahl im Panel“ (1 bis 30) und „Icon der Glocke“ (10 eingebettete Icons, kein Emoji).
- Neu Glocke: „Alle anzeigen“ öffnet ein Fenster mit allen Meldungen. Überschriften untereinander, ein Klick klappt den ganzen Inhalt samt Link auf.
- Neu Glocke: „Alle gelesen“ markiert alle Meldungen, „Ausblenden“ je Meldung und „Gelesene ausblenden“. Persönliche Meldungen merkt sich der Shop, öffentliche der Browser.
- Geändert: Das Öffnen der Glocke allein markiert nichts mehr als gelesen.

## Version 0.6.1

- Geändert: Der Lizenzcode steht nicht mehr in der Adresse (URL). Er geht nur noch per HTTPS im Kopfteil der Anfrage an den Lizenzserver, ohne Weiterleitungen. [Details](docs/LIZENZTRANSPORT.md).
- Geändert: Updates kommen jetzt über eine Prüfsummen-Datei auf theme.michael-gahn.de (`plugin-updates/michatheme-v5-shopware.json`). Das ZIP kommt vom GitHub-Release. Größe, SHA-256-Prüfsumme und alle Pfade im ZIP werden vor dem Entpacken geprüft. Geht etwas schief, bleibt die bisherige Version unverändert.
- Geändert: Kein stilles Update mehr. Die stündliche Prüfung (Einstellung, ab Werk aus) sieht nur nach und zeigt einen Hinweis. Eingespielt wird erst nach einem Klick unter MichaThemeV5, Info, Karte **Updates**. Dafür braucht der Benutzer das Recht, Einstellungen zu ändern. Danach wie gewohnt unter Erweiterungen, Meine Erweiterungen auf „Aktualisieren“ klicken.
- Geändert: Der Lizenzcode ist im Theme-Manager nicht mehr sichtbar (dort stand er lesbar). Gepflegt wird er auf der Seite **Lizenzen**. Ein schon gespeicherter Code bleibt erhalten.
- Behoben: Ist der Lizenzserver nicht erreichbar, wartet die Lizenzseite nicht mehr auf jede Domain einzeln. Der Ausfall wird 2 Minuten gemerkt, die Gnadenfrist von 48 Stunden bleibt gleich.
- ⚠️ Wer 0.6.0 hat, muss dieses Update einmal von Hand einspielen (ZIP hochladen). Ab 0.6.1 geht es über den Knopf.

## Version 0.6.0

- Neu: Demo-Inhalte per Konsole importieren und entfernen. 16 Beispielartikel in 4 Kategorien, je 3 Platzhalterbilder (48 Bilder, ohne Internetzugriff).
- Importieren: `bin/console michatheme:demo:import` (wiederholbar, keine Dubletten).
- Entfernen: `bin/console michatheme:demo:remove --force`. Entfernen löscht nur markierte Demo-Einträge. Eigene Artikel bleiben unberührt. Vor der Nutzung bitte ein Backup des Shops machen.
- Ehrlich gesagt: Auf einem Demo-Shop mit Shopware 6.7.15.1 per Konsole erprobt. Andere Shopware-Versionen (zum Beispiel 6.6) wurden nicht getestet.

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
