# MichaThemeV5 für Shopware 6

Theme von Michael Gahn DESIGN mit Hell-/Dunkelmodus, vielen Optionen und rechtssicherer Ausrichtung für DE und EU.

**Status:** in Entwicklung (Pre-Alpha).

## Funktionen

26 Free-Funktionen sind im Theme enthalten. Dieses Repo enthält ausschließlich die kostenlosen Funktionen.
Die vollständige Liste mit Status steht in [`docs/FEATURES.md`](docs/FEATURES.md), offene Punkte in [`TODO.md`](TODO.md).

## Weitere Funktionen (Pro)

Dieses Repo enthält nur die kostenlosen Funktionen (Free). Pro-Funktionen und Erweiterungen werden separat und privat ausgeliefert und sind nicht Teil dieses Repos; Informationen, Kauf und Verwaltung unter https://theme.michael-gahn.de (Konto erforderlich).

## Rechtliches

Alle rechtlichen Angaben sind technische Hinweise zum Stand der Erstellung und keine Rechtsberatung. Vor Veröffentlichung von einer Anwältin oder einem Anwalt prüfen lassen.


## Fertige Release-Pakete und GitHub-Updates

Das Release-ZIP enthält alle benötigten Plugin-Dateien einschließlich fertiger CSS-/JavaScript-Dateien. Upload und GitHub-Update verwenden dasselbe geprüfte Paket. Ein manueller Administration- oder Node-Build entfällt.

Die Release-Pipeline prüft PHP, Paketinhalt, Asset-Verweise und Build-Prüfsummen. Veraltete oder veränderte Build-Dateien werden beim lokalen Verpacken abgewiesen; GitHub baut die Styles bei jedem Release frisch.

Neu: optionaler GitHub-Updater mit festem Repository, SHA-256-Prüfung, sicherer ZIP-Prüfung, privater Sicherung und Rückfall bei Fehlern. Automatik bleibt standardmäßig aus. Diese Version zunächst einmal per ZIP installieren.

Nach dem Upload bzw. der automatischen Vorbereitung unter „Erweiterungen → Meine Erweiterungen“ den normalen Shopware-Updatevorgang ausführen. Shopware übernimmt dabei seine Asset- und Cache-Schritte. Für automatische Prüfungen den Schalter in den Plugin-Einstellungen global aktivieren; ScheduledTask-Scheduler und Queue-Worker müssen laufen. Wegen der kurzen Verzeichnis-Umschaltung ein Wartungsfenster verwenden. Eine Shop-Sicherung vor Updates bleibt empfohlen.

Das Theme bleibt Pre-Alpha. Seine eigenen Styles, Skripte und Schriften liegen bereits fertig im Paket. Die normale Shopware-Theme-Zuweisung bzw. Theme-Kompilierung für den jeweiligen Verkaufskanal bleibt Teil von Shopware und wird nicht durch ein universelles all.css ersetzt.

Entwicklung: `python3 scripts/build-assets.py` baut die Dateien. `python3 scripts/build-release.py` prüft den Stand und erzeugt das ZIP unter `dist/`. Ein Push auf `main` erstellt nach erfolgreichen Prüfungen das Release der in `composer.json` angegebenen Version. Bereits veröffentlichte Versionen werden niemals überschrieben.

Das Plugin-Icon und Vorschaubild verwenden das vorhandene MichaTheme-Markenlogo aus dem zugehörigen Plattformprojekt.
