# MichaThemeV5 für Shopware 6

Theme von Michael Gahn DESIGN mit Hell-/Dunkelmodus, vielen Optionen und rechtssicherer Ausrichtung für DE und EU.

**Status:** fertige Version 2.1.1. Vor jedem Update bitte eine Sicherung des Shops machen.

## Lizenztransport in Vorbereitung

Der Entwicklungsstand stellt Lizenzprüfungen auf HTTPS-POST mit Autorisierungsheader um. Token stehen dabei nicht mehr in URLs. Theme und Begleitplugin müssen gemeinsam aktualisiert werden; vor der Veröffentlichung muss die Plattform den neuen Prüfweg unterstützen. Die bisherigen Release-Downloads bleiben unverändert. [Details und Grenzen](docs/LIZENZTRANSPORT.md).

## Funktionen

33 Free-Funktionen sind aufgeführt (fertig oder noch in Arbeit, den Stand zeigt die Liste). Dieses Repo enthält ausschließlich die kostenlosen Funktionen.
Die vollständige Liste mit Status steht in [`docs/FEATURES.md`](docs/FEATURES.md), offene Punkte in [`TODO.md`](TODO.md).

## Aussehen (ab Version 2.1.1)

Hell: Weiß und Hellgrau. Dunkel: Anthrazit. Der Standard-Akzent ist Rot und lässt sich in den Theme-Einstellungen ändern. Rot steht nur bei bedienbaren Dingen (Kaufen-Button, Menüpunkt, Seitenzahl). Alle anderen Buttons sind neutral. Der Hell/Dunkel-Umschalter sitzt standardmäßig in der Kopfzeile.

## Farben und Colorpicker

Der Colorpicker ist ein Farbwähler. Er hat eine Farbfläche, einen Farbton-Regler und ein Feld für den HEX-Wert (zum Beispiel `#c8161a`) mit Kopieren-Knopf. Dazu kommt eine Palette für bis zu 12 gespeicherte Farben und eine Warnung, wenn Text auf deinen Farben schlecht lesbar wäre.

Eingebunden ist er in der Einstellungsseite des Plugins MichaThemeV5: bei WooCommerce ab Plugin 0.5.0, bei JTL-Shop 5 ab Plugin 0.5.1 und bei Shopware 6 im Admin-Modul ab 0.5.1. Dort gibt es 16 Farbfelder je Hell und Dunkel. Ohne Plugin wählst du die Akzentfarbe wie bisher aus der Liste oder als eigene Farbe (HEX-Wert) in den Theme-Einstellungen. Bei Shopify gibt es den Colorpicker nicht: Der Theme-Editor hat einen eigenen Farbwähler, und gespeicherte Paletten sind dort nicht möglich.

Ehrlich gesagt: Die Plugins sind bisher nur in Test- und Demo-Umgebungen geprüft. Vor jedem Update bitte eine Sicherung machen.

## Icon-Leiste in der Kopfzeile (ab Version 2.1.1)

Von links nach rechts: Hell/Dunkel-Schalter, Glocke, Merkliste, Favoriten, Konto, Warenkorb. Die Suche bleibt in der Mitte.

- **Hell/Dunkel-Schalter:** In der Kopfzeile nur als Symbol (ohne Text). Wie er gerade steht, liest ein Screenreader aus dem Namen des Knopfes vor. In den Theme-Einstellungen unter „Ort des Hell/Dunkel-Schalters“ lässt er sich in den Footer oder ins Benutzerkonto verlegen. Im Benutzerkonto erscheint er als Eintrag im Konto-Menü, aber nur für angemeldete Kunden (Gäste haben dort keine Menüs).
- **Glocke:** Erscheint erst, wenn es mindestens eine echte Benachrichtigung gibt. Sonst ist sie unsichtbar.
- **Merkliste:** Das ist die normale Wunschliste von Shopware. Das Symbol erscheint erst, wenn etwas drin liegt. Ist die Wunschliste im Admin ausgeschaltet, gibt es auch kein Symbol.
- **Favoriten:** Eine eigene Herz-Liste des Themes. Das Herz sitzt auf den Produktkarten und auf der Artikelseite. Die Liste steht nur im Browser des Besuchers (nichts geht an den Server). Das Symbol in der Kopfzeile erscheint erst, wenn mindestens ein Favorit gespeichert ist. Abschaltbar in den Theme-Einstellungen („Favoriten (Herz-Liste) anzeigen“).

## Demo-Inhalte (ab Version 2.1.1)

Per Konsole lassen sich 16 Beispielartikel in 4 Kategorien mit 48 Platzhalterbildern anlegen:

- Importieren: `bin/console michatheme:demo:import` (wiederholbar, keine Dubletten)
- Entfernen: `bin/console michatheme:demo:remove --force`

Entfernen löscht nur markierte Demo-Einträge. Vor der Nutzung bitte ein Backup des Shops machen. Erprobt auf Shopware 6.7.15.1.

## Admin-Modul (ab Version 2.1.1) und Layout (ab 0.5.3)

Das Plugin bringt eine eigene Einstellungsseite im Shopware-Admin mit. So findest du sie:

1. Öffne im Admin **Einstellungen**, dann **Erweiterungen**, dann **MichaThemeV5**.
2. Oben stehen vier Reiter: **Einstellungen**, **Lizenzen**, **Updates** und **Info**.
3. **Einstellungen:** Wähle ein Design-Preset (Standard, Glas, Kompakt), suche eine Einstellung oder schalte zwischen „Einfach“ und „Experte“ um. Unter „Eigene Farben“ (nur im Modus „Experte“) stellst du 16 Farben getrennt für Hell und Dunkel ein, mit Farbwähler, Palette für 12 Farben und Warnung bei schlecht lesbarem Text. Klicke dann auf **Speichern**. Das Theme wird neu übersetzt, das dauert bis zu einer Minute.
4. **Lizenzen:** Füge deinen Lizenzcode ein und klicke auf „Speichern und prüfen“. Der Code wird danach nie mehr im Klartext angezeigt. Ohne Code läuft alles in der Free-Version weiter. Kaufen kannst du auf https://theme.michael-gahn.de.
5. **Updates (ab Version 2.1.1):** Öffnet die Seite aus dem Plugin-Baukasten mit Info, Updates (Knopf „Jetzt aktualisieren“), „Weitere Plugins“ und dem Schalter „Installation melden“. Es wird nichts automatisch installiert.

Die Werte liegen in der normalen Theme-Konfiguration (Inhalte, Themes). Beide Wege ändern dasselbe, nichts geht verloren. Du brauchst keinen Build, das Admin-Skript liegt fertig im Paket. Recht für Benutzerrollen: Unter „Benutzer & Berechtigungen“ gibt es die Rechte „MichaThemeV5 ansehen“ und „bearbeiten“.

Ab Version 2.1.1 gibt es auch auf Shopware drei Layout-Einstellungen (Gruppe „Form und Stil“): **Kartenstil** (flach, mit Rahmen, mit Schatten), **Flächenstil** (einfarbig oder Glas) und **Inhaltsbreite** (schmal, normal, breit). Glas ist halbtransparent mit Weichzeichner. Bei älteren Browsern und bei der Systemeinstellung „Transparenz reduzieren“ bleiben die Flächen einfarbig.

## Weitere Funktionen (Pro)

Dieses Repo enthält nur die kostenlosen Funktionen (Free). Pro-Funktionen und Erweiterungen werden separat und privat ausgeliefert und sind nicht Teil dieses Repos; Informationen, Kauf und Verwaltung unter https://theme.michael-gahn.de (Konto erforderlich).

## Lizenz

- Der eigene Code und die eigenen Gestaltungen dieses Themes gehören Michael Gahn DESIGN. Alle Rechte sind vorbehalten. Die Datei [`LICENSE`](LICENSE) sagt das in einem Satz.
- Die Schriften im Theme sind frei nutzbar unter der SIL Open Font License. Die Texte dazu liegen bei den Schriften (`src/Resources/public/mt/fonts/LICENSE-*.txt`).
- Plugins und Fremdcode behalten ihre eigene Lizenz.
- Das ist keine Rechtsberatung; die Lizenzfrage wird noch rechtlich geprüft.

## Rechtliches

Alle rechtlichen Angaben sind technische Hinweise zum Stand der Erstellung und keine Rechtsberatung. Vor Veröffentlichung von einer Anwältin oder einem Anwalt prüfen lassen.

## Benachrichtigungs-Center (Glocke)

Ab Version 2.1.1 funktioniert die Glocke wieder (Shopware 6.6 und 6.7). Sie steht oben in der Kopfleiste und unten im Footer. Eingeloggte Kunden sehen dort ihre eigenen Bestell-Meldungen. Öffentliche Meldungen für alle Besucher lassen sich bisher nur über die Admin-API anlegen (`POST /api/_action/mgd-notification-center`); eine fertige Oberfläche dafür im Admin gibt es noch nicht. Mehr dazu in [`docs/INSTALL.md`](docs/INSTALL.md).

## Favicon (ab Version 2.1.1, Logo ab 1.5.2)

Das Favicon ist das kleine Bild im Browser-Tab.

- Ab Werk zeigt der Shop das Michael-Gahn-DESIGN-Logo.
- Eigenes Favicon:
  1. Administration öffnen.
  2. „Inhalte“ > „Themes“ > MichaThemeV5.
  3. Im Bereich „Medien“ bei „Favicon“ ein eigenes Bild wählen (am besten quadratisch, mindestens 192 × 192 Pixel).
  4. Speichern.
- Entfernst du dein Bild wieder, erscheint automatisch wieder das Logo.

## Datenschutz: Aktiv-Meldung (ab Version 2.1.1, Schalter ab 1.6.0 auf der neuen Seite)

Das Plugin meldet sich bei theme.michael-gahn.de. So weiß Michael Gahn DESIGN, wie viele Shops das kostenlose Theme nutzen.

**Was wird gesendet?** Nur diese 5 Angaben:

1. Plugin-Name (`michatheme-v5-shopware`)
2. Version (zum Beispiel `1.5.0`)
3. Shopsystem (`shopware6`)
4. Domain des Shops (zum Beispiel `mein-shop.de`)
5. Eine zufällige Installations-ID (eine lange Zufallsnummer, ohne Bezug zu Ihnen)

Es werden keine Kundendaten, keine E-Mail-Adressen und keine Bestellungen gesendet.

**Wann wird gesendet?**

- Beim Installieren, Aktivieren und Aktualisieren des Plugins.
- Danach höchstens einmal am Tag (über den Shopware-Scheduler, danach `bin/console scheduled-task:register` nicht vergessen).

**So schalten Sie es ab:**

1. In der Administration „Einstellungen“ > „Erweiterungen“ > MichaThemeV5 öffnen (der Eintrag mit den Bereichen Updates und „Weitere Plugins“).
2. Beim Bereich „Installation melden“ den Schalter ausschalten.

Beim Ausschalten wird der Eintrag auf theme.michael-gahn.de gelöscht. Danach sendet das Plugin nichts mehr.

**Wichtig:** Das Plugin funktioniert immer voll weiter. Egal, ob der Schalter an oder aus ist und egal, ob theme.michael-gahn.de erreichbar ist.

## Fertige Release-Pakete und GitHub-Updates

Das Release-ZIP enthält alle benötigten Plugin-Dateien einschließlich fertiger CSS-/JavaScript-Dateien. Upload und GitHub-Update verwenden dasselbe geprüfte Paket. Ein manueller Administration- oder Node-Build entfällt.

Die Release-Pipeline prüft PHP, Paketinhalt, Asset-Verweise und Build-Prüfsummen. Veraltete oder veränderte Build-Dateien werden beim lokalen Verpacken abgewiesen; GitHub baut die Styles bei jedem Release frisch.

Neu: optionaler GitHub-Updater mit festem Repository, SHA-256-Prüfung, sicherer ZIP-Prüfung, privater Sicherung und Rückfall bei Fehlern. Automatik bleibt standardmäßig aus. Diese Version zunächst einmal per ZIP installieren.

Nach dem Upload bzw. der automatischen Vorbereitung unter „Erweiterungen → Meine Erweiterungen“ den normalen Shopware-Updatevorgang ausführen. Shopware übernimmt dabei seine Asset- und Cache-Schritte. Seit 1.6.0 gibt es keine automatische Prüfung mehr: Updates zeigt die neue Seite, eingespielt wird nur per Klick. Wegen der kurzen Verzeichnis-Umschaltung ein Wartungsfenster verwenden. Eine Shop-Sicherung vor Updates bleibt empfohlen.

Ab Version 2.1.1 ist das Theme eine fertige Version. Seine eigenen Styles, Skripte und Schriften liegen bereits fertig im Paket. Die normale Shopware-Theme-Zuweisung bzw. Theme-Kompilierung für den jeweiligen Verkaufskanal bleibt Teil von Shopware und wird nicht durch ein universelles all.css ersetzt.

Entwicklung: `python3 scripts/build-assets.py` baut die Dateien. `python3 scripts/build-release.py` prüft den Stand und erzeugt das ZIP unter `dist/`. Ein Push auf `main` erstellt nach erfolgreichen Prüfungen das Release der in `composer.json` angegebenen Version. Bereits veröffentlichte Versionen werden niemals überschrieben.

Das Plugin-Icon und Vorschaubild verwenden das vorhandene MichaTheme-Markenlogo aus dem zugehörigen Plattformprojekt.
