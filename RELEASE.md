# Version 0.4.0 (Pre-Alpha)

Das Theme ist noch in Entwicklung (Pre-Alpha). Bitte zuerst in einem Test-Shop ausprobieren, nicht direkt im Live-Shop.

## Neu in dieser Version

- Neue Icon-Leiste in der Kopfzeile, von links nach rechts: Hell/Dunkel-Schalter, Glocke, Merkliste, Favoriten, Konto, Warenkorb. Die Suche bleibt in der Mitte.
- Der Hell/Dunkel-Schalter zeigt in der Kopfzeile nur noch ein Symbol. Den Zustand liest man im Tooltip bzw. Screenreader-Namen.
- Neue Einstellung „Ort des Hell/Dunkel-Schalters“: Header, Footer oder Benutzerkonto. Im Benutzerkonto steht er im Konto-Menü, aber nur für angemeldete Kunden.
- Die Glocke ist unsichtbar, solange es keine Benachrichtigung gibt.
- Die Merkliste ist die normale Shopware-Wunschliste. Das Symbol zeigt sich erst, wenn etwas drin liegt.
- Neu: Favoriten (Herz). Herz auf Produktkarten und auf der Artikelseite, Liste nur im Browser, Symbol in der Kopfzeile erst bei mindestens einem Eintrag. In den Theme-Einstellungen abschaltbar.
- Zähler an Merkliste, Favoriten und Glocke sind neutral grau. Nur der Warenkorb-Zähler bleibt in der Akzentfarbe.

## Noch nicht fertig

- Shopware 6.6 wurde nicht live getestet (Vorlagen-Blöcke sind gegen 6.6.10.0 geprüft).
- Hell/Dunkel-Schalter im Benutzerkonto: Gäste ohne Konto sehen ihn dort nicht.
- Auf Produktkarten liegen das Herz der Wunschliste (Shopware) und das Herz der Favoriten (Theme) nebeneinander.
- Der optionale GitHub-Updater ist standardmäßig aus. Bitte per ZIP-Upload installieren.

## So installieren

1. Datei `MichaThemeV5.zip` herunterladen. Die Prüfsumme steht in `MichaThemeV5.zip.sha256`.
2. In Shopware unter "Erweiterungen" > "Meine Erweiterungen" hochladen und den Update-Schritt ausführen.
3. `bin/console theme:compile` ausführen, danach den Cache leeren.
4. Vor jedem Update eine Sicherung des Shops machen.
