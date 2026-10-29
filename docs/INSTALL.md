# Installation (Entwicklungsstand)

> Pre-Alpha. Das Theme wurde statisch geprüft (JSON, CSS, PHP-Syntax) und noch nicht in einer laufenden Shopware-Instanz getestet.

1. Ordner nach `custom/plugins/MichaThemeV5` kopieren (oder per Composer einbinden).
2. `bin/console plugin:refresh && bin/console plugin:install --activate MichaThemeV5`
3. `bin/console theme:change` (Theme einem Verkaufskanal zuweisen) und `bin/console theme:compile`
4. Assets: `bin/console assets:install`
5. Im Administrationsbereich unter Erscheinungsbild das Theme öffnen. Die Optionen sind nach Bereichen geordnet, jeweils getrennt in "Einfach" und "Experte".

## Aussehen und Icon-Leiste einstellen (ab 0.3.0 und 0.4.0)

1. Öffne im Administrationsbereich Erscheinungsbild, dann Themes, dann MichaThemeV5.
2. Bereich **Farben**: Wähle die Akzentfarbe (Standard ist Rot) und den „Ort des Hell/Dunkel-Schalters“ (Header, Footer oder Benutzerkonto).
3. Bereich **Header**: „Favoriten (Herz-Liste) anzeigen“ schaltet die Herzen an oder aus.
4. Speichere und führe `bin/console theme:compile` aus.

Die Icon-Leiste zeigt von links nach rechts: Hell/Dunkel-Schalter, Glocke, Merkliste, Favoriten, Konto, Warenkorb. Glocke, Merkliste und Favoriten sind unsichtbar, solange nichts drin ist. Die Merkliste ist die Wunschliste von Shopware.

## Admin-Modul und Farben (ab 0.5.1)

1. Öffne im Admin Einstellungen, dann Erweiterungen, dann MichaThemeV5.
2. Reiter **Einstellungen**: Preset wählen oder Einstellungen ändern, dann **Speichern**. Das Theme wird neu übersetzt (bis zu einer Minute).
3. Eigene Farben: Schalter „Experte“ einschalten, Karte „Eigene Farben“ öffnen, bei einer Farbe auf „Farbwähler öffnen“ klicken. Leer lassen heißt Standardfarbe.
4. Reiter **Lizenzen**: Lizenzcode einfügen, „Speichern und prüfen“. Ohne Code läuft die Free-Version.
5. Kein Build nötig. Das Admin-Skript liegt fertig im Paket. Entwickler: `python3 scripts/build-admin.py` baut es aus `src/Resources/app/administration` neu.
6. Nach einem Update: `bin/console plugin:update MichaThemeV5`, `assets:install`, `theme:compile`, `cache:clear`.

## Erzeugte Dateien

`src/Resources/theme.json`, `src/Resources/public/mt/*` (außer `mt-shopware.css`) und `views/storefront/layout/mt-config.html.twig` werden aus dem Optionskatalog des Repos MichaThemeV5-Pro erzeugt (`php bin/build-themes.php shopware <Ordner>`). Nicht von Hand ändern.

## Erweiterungen

Dieses Repo enthält nur die kostenlosen Funktionen (Free). Pro-Funktionen und Erweiterungen werden separat und privat ausgeliefert, nicht über dieses Repo (https://theme.michael-gahn.de, Konto erforderlich). Ein optionaler Lizenzschlüssel kann in den Theme-Einstellungen unter „Lizenz“ eingetragen werden; ohne Schlüssel läuft das Theme vollständig.

## Recht: Felder und Hinweise

Custom Fields am Produkt (Einstellungen, System, Custom Fields, Typ Text): `mt_gpsr_manufacturer`, `mt_gpsr_responsible_person`, `mt_gpsr_contact`, `mt_gpsr_safety_info`. Steuer- und Versandhinweis, Lieferzeit, Grundpreis, niedrigster Preis der letzten 30 Tage, der Widerrufs-Button (ab 6.7.9), der Gewährleistungshinweis im Bestellabschluss und das GARAN-Label (ab 6.7.14) kommen von Shopware selbst und werden nicht doppelt ausgegeben. Ausverkaufte Artikel ausblenden stellt Shopware im Verkaufskanal ein. Für Videos mit 2-Klick den Baustein `@MichaThemeV5/storefront/component/mt-video-consent.html.twig` einbinden. Pfade und Block-Namen stammen aus Shopware 6.7 und sind im Shop zu prüfen. Technische Hinweise, keine Rechtsberatung. Texte und Einsatz anwaltlich prüfen lassen. Eigene Cookie-Banner liefert das Theme nicht; den Bestellbutton beschriftet die Kasse bzw. ein Rechtsplugin (Button-Lösung § 312j BGB).

## Preise und Lieferzeit (kurz erklärt)

Der niedrigste Preis der letzten 30 Tage (Omnibus-Hinweis) und die Lieferzeit werden von Shopware selbst angezeigt. Das Theme blendet beides nicht aus.

1. Den Preis der letzten 30 Tage zeigt Shopware nur, wenn er am Produkt eingetragen ist (Feld "Regulierungspreis" bei den Preisen). Das Theme berechnet ihn nicht.
2. Die Lieferzeit kommt aus der Lieferzeit, die dem Produkt zugewiesen ist.
3. Ob die Anzeige in Ihrem Shop richtig aussieht, bitte selbst im Shop prüfen. Das ist in dieser Version noch nicht in einem echten Shop mit Regulierungspreis getestet.

## Benachrichtigungs-Center (Glocke)

Ab Version 0.2.4 ist die Glocke wieder an (Shopware 6.6 und 6.7). So funktioniert sie:

1. Die Glocke steht in der Kopfleiste und im Footer. Ein Klick öffnet die Liste.
2. Eingeloggte Kunden sehen ihre eigenen Meldungen zu Bestellungen (z. B. "Bestellung 10001: Der Status deiner Bestellung wurde aktualisiert."). Die rote Zahl zeigt die ungelesenen. Beim Öffnen gelten sie als gelesen. Dafür wird nichts im Browser gespeichert.
3. Besucher ohne Login sehen nur öffentliche Meldungen. Die gibt es nur, wenn Sie welche anlegen: per Admin-API `POST /api/_action/mgd-notification-center` (Felder `scope=public`, `status=published`, `title`, `body`, optional `targetUrl`). Dafür brauchen Sie Admin-Rechte zum Ändern der Einstellungen. Eine fertige Oberfläche im Admin gibt es noch nicht.
4. Die Glocke lässt sich in den Plugin-Einstellungen unter "Benachrichtigungs-Center (Glocke)" ausschalten. Dann ist sie unsichtbar und es werden keine neuen Meldungen mehr gespeichert.
5. "Produkt aktualisiert" als öffentliche Meldung ist standardmäßig aus (gleicher Einstellungsbereich), weil Shopware Produkte auch bei Lagerbestand und Preisen laufend ändert.

Nach dem Update: `bin/console cache:clear`, dann `bin/console theme:compile`. Das Skript der Glocke liegt fertig im Paket (`src/Resources/app/storefront/dist`). Ein Node-Build ist nicht nötig.

Für Entwickler: Die Quelle liegt in `src/Resources/app/storefront/src/js/mt-notification-center.js`. Nach Änderungen `sh scripts/build-storefront.sh` ausführen. Die Prüfung in GitHub schlägt sonst fehl.
