# Installation (Entwicklungsstand)

> Pre-Alpha. Das Theme wurde statisch geprüft (JSON, CSS, PHP-Syntax) und noch nicht in einer laufenden Shopware-Instanz getestet.

1. Ordner nach `custom/plugins/MichaThemeV5` kopieren (oder per Composer einbinden).
2. `bin/console plugin:refresh && bin/console plugin:install --activate MichaThemeV5`
3. `bin/console theme:change` (Theme einem Verkaufskanal zuweisen) und `bin/console theme:compile`
4. Assets: `bin/console assets:install`
5. Im Administrationsbereich unter Erscheinungsbild das Theme öffnen. Die Optionen sind nach Bereichen geordnet, jeweils getrennt in "Einfach" und "Experte".

## Erzeugte Dateien

`src/Resources/theme.json`, `src/Resources/public/mt/*` (außer `mt-shopware.css`) und `views/storefront/layout/mt-config.html.twig` werden aus dem Optionskatalog des Repos MichaThemeV5-Pro erzeugt (`php bin/build-themes.php shopware <Ordner>`). Nicht von Hand ändern.

## Erweiterungen

Dieses Repo enthält nur die kostenlosen Funktionen (Free). Pro-Funktionen und Erweiterungen werden separat und privat ausgeliefert, nicht über dieses Repo (https://theme.michael-gahn.de, Konto erforderlich). Ein optionaler Lizenzschlüssel kann in den Theme-Einstellungen unter „Lizenz“ eingetragen werden; ohne Schlüssel läuft das Theme vollständig.

## Recht: Felder und Hinweise

Custom Fields am Produkt (Einstellungen, System, Custom Fields, Typ Text): `mt_gpsr_manufacturer`, `mt_gpsr_responsible_person`, `mt_gpsr_contact`, `mt_gpsr_safety_info`. Steuer- und Versandhinweis, Lieferzeit, Grundpreis, niedrigster Preis der letzten 30 Tage, der Widerrufs-Button (ab 6.7.9), der Gewährleistungshinweis im Bestellabschluss und das GARAN-Label (ab 6.7.14) kommen von Shopware selbst und werden nicht doppelt ausgegeben. Ausverkaufte Artikel ausblenden stellt Shopware im Verkaufskanal ein. Für Videos mit 2-Klick den Baustein `@MichaThemeV5/storefront/component/mt-video-consent.html.twig` einbinden. Pfade und Block-Namen stammen aus Shopware 6.7 und sind im Shop zu prüfen. Technische Hinweise, keine Rechtsberatung. Texte und Einsatz anwaltlich prüfen lassen. Eigene Cookie-Banner liefert das Theme nicht; den Bestellbutton beschriftet die Kasse bzw. ein Rechtsplugin (Button-Lösung § 312j BGB).