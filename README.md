# MichaThemeV5 für Shopware 6

Theme von Michael Gahn DESIGN mit Hell-/Dunkelmodus, vielen Optionen und rechtssicherer Ausrichtung für DE und EU.

**Status:** in Entwicklung (Pre-Alpha).

## Funktionen

33 Free-Funktionen sind aufgeführt (fertig oder noch in Arbeit, den Stand zeigt die Liste). Dieses Repo enthält ausschließlich die kostenlosen Funktionen.
Die vollständige Liste mit Status steht in [`docs/FEATURES.md`](docs/FEATURES.md), offene Punkte in [`TODO.md`](TODO.md).

## Aussehen (ab Version 0.3.0)

Hell: Weiß und Hellgrau. Dunkel: Anthrazit. Der Standard-Akzent ist Rot und lässt sich in den Theme-Einstellungen ändern. Rot steht nur bei bedienbaren Dingen (Kaufen-Button, Menüpunkt, Seitenzahl). Alle anderen Buttons sind neutral. Der Hell/Dunkel-Umschalter sitzt standardmäßig in der Kopfzeile.

## Farben und Colorpicker

Der Colorpicker ist ein Farbwähler. Er hat eine Farbfläche, einen Farbton-Regler und ein Feld für den HEX-Wert (zum Beispiel `#c8161a`) mit Kopieren-Knopf. Dazu kommt eine Palette für bis zu 12 gespeicherte Farben und eine Warnung, wenn Text auf deinen Farben schlecht lesbar wäre.

Eingebunden ist er in der Einstellungsseite des Plugins MichaThemeV5: bei WooCommerce ab Plugin 0.5.0, bei JTL-Shop 5 ab Plugin 0.5.1 und bei Shopware 6 im Admin-Modul ab 0.5.1. Dort gibt es 16 Farbfelder je Hell und Dunkel. Ohne Plugin wählst du die Akzentfarbe wie bisher aus der Liste oder als eigene Farbe (HEX-Wert) in den Theme-Einstellungen. Bei Shopify gibt es den Colorpicker nicht: Der Theme-Editor hat einen eigenen Farbwähler, und gespeicherte Paletten sind dort nicht möglich.

Ehrlich gesagt: Die Plugins sind Pre-Alpha und bisher nur in Test- und Demo-Umgebungen geprüft.

## Icon-Leiste in der Kopfzeile (ab Version 0.4.0)

Von links nach rechts: Hell/Dunkel-Schalter, Glocke, Merkliste, Favoriten, Konto, Warenkorb. Die Suche bleibt in der Mitte.

- **Hell/Dunkel-Schalter:** In der Kopfzeile nur als Symbol (ohne Text). Wie er gerade steht, liest ein Screenreader aus dem Namen des Knopfes vor. In den Theme-Einstellungen unter „Ort des Hell/Dunkel-Schalters“ lässt er sich in den Footer oder ins Benutzerkonto verlegen. Im Benutzerkonto erscheint er als Eintrag im Konto-Menü, aber nur für angemeldete Kunden (Gäste haben dort keine Menüs).
- **Glocke:** Erscheint erst, wenn es mindestens eine echte Benachrichtigung gibt. Sonst ist sie unsichtbar.
- **Merkliste:** Das ist die normale Wunschliste von Shopware. Das Symbol erscheint erst, wenn etwas drin liegt. Ist die Wunschliste im Admin ausgeschaltet, gibt es auch kein Symbol.
- **Favoriten:** Eine eigene Herz-Liste des Themes. Das Herz sitzt auf den Produktkarten und auf der Artikelseite. Die Liste steht nur im Browser des Besuchers (nichts geht an den Server). Das Symbol in der Kopfzeile erscheint erst, wenn mindestens ein Favorit gespeichert ist. Abschaltbar in den Theme-Einstellungen („Favoriten (Herz-Liste) anzeigen“).

## Admin-Modul (ab Version 0.5.1) und Layout (ab 0.5.3)

Das Plugin bringt eine eigene Einstellungsseite im Shopware-Admin mit. So findest du sie:

1. Öffne im Admin **Einstellungen**, dann **Erweiterungen**, dann **MichaThemeV5**.
2. Oben stehen vier Reiter: **Einstellungen**, **Lizenzen**, **Plugin-Empfehlungen** und **Info**.
3. **Einstellungen:** Wähle ein Design-Preset (Standard, Glas, Kompakt), suche eine Einstellung oder schalte zwischen „Einfach“ und „Experte“ um. Unter „Eigene Farben“ (nur im Modus „Experte“) stellst du 16 Farben getrennt für Hell und Dunkel ein, mit Farbwähler, Palette für 12 Farben und Warnung bei schlecht lesbarem Text. Klicke dann auf **Speichern**. Das Theme wird neu übersetzt, das dauert bis zu einer Minute.
4. **Lizenzen:** Füge deinen Lizenzcode ein und klicke auf „Speichern und prüfen“. Der Code wird danach nie mehr im Klartext angezeigt. Ohne Code läuft alles in der Free-Version weiter. Kaufen kannst du auf https://theme.michael-gahn.de.
5. **Plugin-Empfehlungen:** Weitere Plugins von Michael Gahn DESIGN. Es wird nichts automatisch installiert.

Die Werte liegen in der normalen Theme-Konfiguration (Inhalte, Themes). Beide Wege ändern dasselbe, nichts geht verloren. Du brauchst keinen Build, das Admin-Skript liegt fertig im Paket. Recht für Benutzerrollen: Unter „Benutzer & Berechtigungen“ gibt es die Rechte „MichaThemeV5 ansehen“ und „bearbeiten“.

Ab Version 0.5.3 gibt es auch auf Shopware drei Layout-Einstellungen (Gruppe „Form und Stil“): **Kartenstil** (flach, mit Rahmen, mit Schatten), **Flächenstil** (einfarbig oder Glas) und **Inhaltsbreite** (schmal, normal, breit). Glas ist halbtransparent mit Weichzeichner. Bei älteren Browsern und bei der Systemeinstellung „Transparenz reduzieren“ bleiben die Flächen einfarbig.

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

Ab Version 0.2.4 funktioniert die Glocke wieder (Shopware 6.6 und 6.7). Sie steht oben in der Kopfleiste und unten im Footer. Eingeloggte Kunden sehen dort ihre eigenen Bestell-Meldungen. Öffentliche Meldungen für alle Besucher lassen sich bisher nur über die Admin-API anlegen (`POST /api/_action/mgd-notification-center`); eine fertige Oberfläche dafür im Admin gibt es noch nicht. Mehr dazu in [`docs/INSTALL.md`](docs/INSTALL.md).

## Fertige Release-Pakete und GitHub-Updates

Das Release-ZIP enthält alle benötigten Plugin-Dateien einschließlich fertiger CSS-/JavaScript-Dateien. Upload und GitHub-Update verwenden dasselbe geprüfte Paket. Ein manueller Administration- oder Node-Build entfällt.

Die Release-Pipeline prüft PHP, Paketinhalt, Asset-Verweise und Build-Prüfsummen. Veraltete oder veränderte Build-Dateien werden beim lokalen Verpacken abgewiesen; GitHub baut die Styles bei jedem Release frisch.

Neu: optionaler GitHub-Updater mit festem Repository, SHA-256-Prüfung, sicherer ZIP-Prüfung, privater Sicherung und Rückfall bei Fehlern. Automatik bleibt standardmäßig aus. Diese Version zunächst einmal per ZIP installieren.

Nach dem Upload bzw. der automatischen Vorbereitung unter „Erweiterungen → Meine Erweiterungen“ den normalen Shopware-Updatevorgang ausführen. Shopware übernimmt dabei seine Asset- und Cache-Schritte. Für automatische Prüfungen den Schalter in den Plugin-Einstellungen global aktivieren; ScheduledTask-Scheduler und Queue-Worker müssen laufen. Wegen der kurzen Verzeichnis-Umschaltung ein Wartungsfenster verwenden. Eine Shop-Sicherung vor Updates bleibt empfohlen.

Das Theme bleibt Pre-Alpha. Seine eigenen Styles, Skripte und Schriften liegen bereits fertig im Paket. Die normale Shopware-Theme-Zuweisung bzw. Theme-Kompilierung für den jeweiligen Verkaufskanal bleibt Teil von Shopware und wird nicht durch ein universelles all.css ersetzt.

Entwicklung: `python3 scripts/build-assets.py` baut die Dateien. `python3 scripts/build-release.py` prüft den Stand und erzeugt das ZIP unter `dist/`. Ein Push auf `main` erstellt nach erfolgreichen Prüfungen das Release der in `composer.json` angegebenen Version. Bereits veröffentlichte Versionen werden niemals überschrieben.

Das Plugin-Icon und Vorschaubild verwenden das vorhandene MichaTheme-Markenlogo aus dem zugehörigen Plattformprojekt.
