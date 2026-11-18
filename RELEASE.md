# Version 1.5.0

MichaThemeV5 für Shopware 6 meldet sich jetzt kurz bei theme.michael-gahn.de. Das hilft zu zählen, wie viele Shops das kostenlose Theme nutzen.

## Was ist neu?

- Aktiv-Meldung: Das Plugin meldet sich beim Installieren, Aktivieren und Aktualisieren. Danach höchstens einmal am Tag.
- Gesendet werden nur: Plugin-Name, Version, Shopsystem, die Domain des Shops und eine zufällige Installations-ID. Keine Kundendaten, keine E-Mail, keine Bestellungen.
- Abschaltbar: „Erweiterungen“ > „Meine Erweiterungen“ > MichaThemeV5 > „Konfigurieren“, Karte „Aktiv-Meldung“, Schalter „Installation bei Michael Gahn DESIGN melden“. Beim Ausschalten wird der Eintrag auf theme.michael-gahn.de gelöscht.
- Das Plugin funktioniert immer voll weiter. Auch wenn der Schalter aus ist oder theme.michael-gahn.de nicht erreichbar ist.

Das ist schon drin (aus den Versionen davor):

- Admin-Modul unter Einstellungen, Erweiterungen, MichaThemeV5: Einstellungen, Lizenzen, Plugin-Empfehlungen und Info an einem Ort.
- 16 eigene Farben für Hell und Dunkel, Design-Presets (Standard, Glas, Kompakt), Kartenstil, Flächenstil und Inhaltsbreite.
- Glocke (Meldungen) mit „Alle anzeigen“, „Alle gelesen“ und „Ausblenden“. Anzahl und Icon sind einstellbar.
- Demo-Inhalte per Konsole: `bin/console michatheme:demo:import` und `bin/console michatheme:demo:remove --force`.

## Bekannte Grenzen

- Geprüft mit Shopware 6.7.15.1. Shopware 6.6 wurde nicht getestet.
- Die tägliche Meldung braucht den Shopware-Scheduler (Cron oder Queue-Worker). Ohne Scheduler meldet sich das Plugin, wenn jemand MichaThemeV5, Info öffnet.
- Hell/Dunkel-Schalter im Benutzerkonto: Gäste ohne Konto sehen ihn dort nicht.
- Auf Produktkarten liegen das Herz der Wunschliste (Shopware) und das Herz der Favoriten (Theme) nebeneinander.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter „Erweiterungen“ > „Meine Erweiterungen“ hochladen.
3. Das Plugin installieren und aktivieren. Das Theme dem Verkaufskanal zuweisen.
4. `bin/console theme:compile` ausführen, danach den Cache leeren.

## Update von einer älteren Version

1. Zuerst eine Sicherung des Shops machen (Dateien und Datenbank).
2. Die neue `MichaThemeV5.zip` hochladen und bei „Meine Erweiterungen“ auf „Aktualisieren“ klicken.
3. `bin/console theme:compile` ausführen, danach den Cache leeren.

Wer schon 0.6.1 oder neuer hat, kann das Update auch unter MichaThemeV5, Info, Karte „Updates“ per Knopf einspielen. Auch dann vorher eine Sicherung machen.
