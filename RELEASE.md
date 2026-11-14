# Version 1.4.0

MichaThemeV5 für Shopware 6 ist jetzt eine fertige Version. Die Pre-Alpha-Phase ist vorbei.

## Was ist neu?

- Fertige Version: Das Theme ist für den Einsatz im Shop freigegeben.
- Einheitliche Versionsnummer 1.4.0 für alle Produkte von Michael Gahn DESIGN (WordPress, JTL-Shop, Shopware, Shopify). So sieht man sofort, welche Stände zusammengehören.
- Inhaltlich gleich wie 0.7.0. Es gibt keine neuen Funktionen und keine Änderungen am Code.

Das ist schon drin (aus den Versionen davor):

- Admin-Modul unter Einstellungen, Erweiterungen, MichaThemeV5: Einstellungen, Lizenzen, Plugin-Empfehlungen und Info an einem Ort.
- 16 eigene Farben für Hell und Dunkel, Design-Presets (Standard, Glas, Kompakt), Kartenstil, Flächenstil und Inhaltsbreite.
- Glocke (Meldungen) mit „Alle anzeigen“, „Alle gelesen“ und „Ausblenden“. Anzahl und Icon sind einstellbar.
- Demo-Inhalte per Konsole: `bin/console michatheme:demo:import` und `bin/console michatheme:demo:remove --force`.

## Bekannte Grenzen

- Geprüft mit Shopware 6.7.15.1. Shopware 6.6 wurde nicht getestet.
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
