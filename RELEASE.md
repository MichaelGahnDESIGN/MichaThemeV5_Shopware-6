# Version 1.6.0

MichaThemeV5 für Shopware 6 hat jetzt eine neue Admin-Seite für Updates, „Weitere Plugins“ und den Schalter „Installation melden“.

## Was ist neu?

- Neue Seite unter „Einstellungen“ > „Erweiterungen“ > MichaThemeV5. Dort stehen Info, Updates, „Weitere Plugins“ und der Schalter „Installation melden“.
- Updates: Die Seite zeigt, ob es eine neue Version gibt. Mit „Jetzt aktualisieren“ spielst du sie ein. Vorher wird die Datei geprüft (Prüfsumme). Es passiert nie etwas von selbst.
- „Weitere Plugins“: Karten mit anderen Plugins von Michael Gahn DESIGN. Installiert wird nichts automatisch.
- „Installation melden“: Der Schalter steht jetzt auf der neuen Seite. Das Plugin meldet sich weiter höchstens einmal am Tag. Gesendet werden nur Plugin-Name, Version, Shopsystem, die Domain des Shops und eine zufällige Installations-ID.

## Was bleibt gleich?

- Einstellungen, Lizenzen und Info in MichaThemeV5 funktionieren wie bisher.
- Theme-Optionen, Farben, Design-Presets, Glocke und Favicon bleiben unverändert.
- Hattest du „Installation melden“ ausgeschaltet, bleibt es aus. Deine Installations-ID bleibt erhalten.
- Das Plugin funktioniert immer voll weiter, auch wenn theme.michael-gahn.de nicht erreichbar ist.

## Was ist abgeschaltet?

- Die alte Update-Karte unter „Info“ und die alte Seite „Plugin-Empfehlungen“ (nicht mehr verlinkt).
- Die alte stündliche Update-Prüfung und die alte tägliche Aufgabe. Die neue tägliche Meldung kommt aus dem Baukasten.
- Die Karten „Updates“ und „Aktiv-Meldung“ in der Plugin-Konfiguration. Den Schalter findest du jetzt auf der neuen Seite.

## Bekannte Grenzen

- Geprüft mit Shopware 6.7.15.1. Shopware 6.6 wurde nicht getestet.
- Der Knopf „Jetzt aktualisieren“ ist neu und wurde noch nicht in einem echten Shopware ausprobiert. Du kannst jederzeit von Hand aktualisieren (siehe unten).
- Die tägliche Meldung braucht den Shopware-Scheduler (Cron oder Queue-Worker).
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
3. `bin/console theme:compile` ausführen.
4. Den Cache leeren, danach `bin/console scheduled-task:register`. Erst dann steht die neue tägliche Aufgabe in der Liste.

Ab Version 1.6.0 geht das Update auch per Knopf: „Einstellungen“ > „Erweiterungen“ > MichaThemeV5 > „Updates“ > „Jetzt aktualisieren“. Auch dann vorher eine Sicherung machen.
