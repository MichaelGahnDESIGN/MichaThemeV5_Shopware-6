# Funktionen – Shopware 6

> Automatisch erzeugt. Nicht von Hand ändern.

**Umfang:** Dieses Repo enthält nur die kostenlosen Funktionen (Free). Pro-Funktionen und Erweiterungen werden separat und privat ausgeliefert und sind nicht Teil dieses Repos; Informationen, Kauf und Verwaltung unter https://theme.michael-gahn.de (Konto erforderlich).

> Alle rechtlichen Angaben sind technische Hinweise zum Stand der Erstellung und keine Rechtsberatung. Vor Veröffentlichung von einer Anwältin oder einem Anwalt prüfen lassen.

Status: **planned** = geplant · **in_progress** = in Arbeit · **existing** = als Plugin vorhanden, Einbindung offen · **done** = fertig · **n/a** = nicht vorgesehen

## Free (im Theme enthalten)

### Design und Konfiguration

- **Farben über Variablen** (geplant): Alle Farben als CSS-Variablen: Akzentfarbe und 16 eigene Farben (Seitenhintergrund, Flächen, Text, Rahmen, Link, Button-Text, Header, Footer, Ankündigung, Sale/Fehler, Erfolg, Warnung, Info, Fokus), je Hell und Dunkel getrennt, leer = Standard des Themes. Mit Kontrast-Warnung (Text 4,5 zu 1, Rahmen und Fokus 3 zu 1). Fertig und getestet für WooCommerce; die anderen Plattformen folgen (geplant 0.5.x).
- **Hell-, Dunkel- und Systemmodus** (in Arbeit): Folgt dem Gerät oder per Schalter im Shop; beide Modi auf Kontrast geprüft (WCAG AA), kein Aufblitzen beim Laden.
- **Einfach- und Experten-Konfigurator** (in Arbeit): Wenige Schlüsseloptionen für Einsteiger, alle Optionen für Profis. Gliederung: Tab, Gruppe, Abschnitt, Feld. Eine gemeinsame Optionsdefinition erzeugt die Konfiguration aller drei Plattformen.
- **Lokale Schriften** (in Arbeit): Lokal eingebettete Schriften (WOFF2, offene Lizenzen): Arial/Helvetica als Systemschrift, Roboto, Open Sans, Inter, Lato, Montserrat, Source Sans 3, Nunito, Merriweather, Playfair Display. Kein Abruf bei Google oder CDNs. _Recht:_ Externe Schriftdienste sind ohne Einwilligung datenschutzrechtlich riskant (u. a. LG München I, Az. 3 O 17493/20); lokale Einbettung ist die sichere Lösung. Schriftlizenzen (OFL) mitliefern.
- **Logo** (in Arbeit): Logo mit Hell-/Dunkel-Variante, SVG und Retina, Größe und Alt-Text einstellbar, Favicon und Touch-Icon.
- **Verschiedene Header** (in Arbeit): Mehrere Header-Layouts (klassisch, zentriert, kompakt), Ankündigungsleiste, optional fixierter Header, Suchfeld-Varianten.
- **Verschiedene Footer** (in Arbeit): Mehrere Footer-Layouts (4-spaltig, 3-spaltig, minimal), Rechtslinks, Zahlungs- und Versandarten, Newsletter-Feld (mit Double-Opt-In). _Recht:_ Pflichtlinks (Impressum, Datenschutz, AGB, Widerruf) immer sichtbar und in jedem Footer-Layout enthalten.
- **Layouts für Kategorie- und Artikellisten** (in Arbeit): Raster mit 2 bis 5 Spalten, Listenansicht, Filter links oder oben, Kartenstile (flach, Rahmen, Schatten), Bildverhältnis, Hover-Effekte.
- **Layouts für Artikel-Detailseiten** (in Arbeit): Galerie links oder unten, fixierte Kaufbox, Tabs oder Akkordeon, Vertrauenselemente, verwandte Artikel.
- **Design-Presets (Stil-Sets)** (fertig): Per Klick anwendbare Stil-Sets, die nur Optionswerte und damit Design-Variablen setzen: Standard (Anthrazit/Hell, Rot), Glas (halbtransparente Flächen, feiner Rand, bleibt lesbar) und Kompakt (weniger Abstand). Vor dem Anwenden wird gesichert; zurück mit „Standard“. In WooCommerce und Shopware (ab 0.5.3) fertig, andere Plattformen geplant.
- **Icon-Leiste im Header** (fertig): Hell/Dunkel-Schalter (nur Icon, Ort wählbar: Header, Footer, Konto), Benachrichtigungen, Merkliste (nur mit nativer Wunschliste), Favoriten als Herz-Liste im Browser, Konto, Warenkorb. Listen sind unsichtbar, solange sie leer sind.
- **Colorpicker (Farbwähler)** (fertig): Farbwahl mit Farbfläche, Farbton-Regler, HEX-Feld mit Kopieren-Knopf und Kontrastwarnung. In der WooCommerce-Plugin-Einstellungsseite an jedem Farbfeld eingebunden (fertig, getestet). JTL folgt mit seiner Plugin-Seite. Shopify nutzt den eingebauten Farbwähler des Theme-Editors.
- **Gespeicherte Farbpalette** (fertig): Bis zu 12 eigene Farben speichern und mit einem Klick wieder wählen, gilt für den ganzen Shop. In WooCommerce fertig und getestet (gespeichert im Shop). JTL folgt. Shopify: nicht möglich, der Theme-Editor kann keine eigenen Paletten speichern.
- **Layout-Varianten per Option** (geplant): Kartenstil (flach, Rahmen, Schatten), Flächenstil (einfarbig oder Glas mit Rückfall bei fehlender Unterstützung und bei „Transparenz reduzieren“) und Inhaltsbreite (schmal, normal, breit). Setzen nur ein data-Attribut am html-Element, keine doppelten Vorlagen. Header-Layout, Dichte und Ecken gibt es schon. Fertig für WooCommerce, andere Plattformen geplant.

### Inhalte und Erlebniswelten

- **Erlebniswelten und Blueprints mit 1-Klick-Demo** (geplant): Professionelle Vorlagen (Startseite, Kategorie, Landingpages) mit kostenloser 1-Klick-Demoinstallation und vielfältigen CMS-Elementen. JTL: Blueprints im OPC; Shopware: Erlebniswelten; WooCommerce: Block-Patterns und Seitenvorlagen.
- **CMS-Elemente** (geplant): Eigene Elemente: JTL-Portlets, Shopware-Blöcke, WooCommerce-Blöcke/Patterns (Hero, Kategorie-Kacheln, Produkt-Slider, Vorteile, FAQ, Testimonials, Newsletter, Marken-Leiste).

### SEO und Geschwindigkeit

- **SEO-Optimierung** (geplant): Semantisches HTML, saubere Überschriften-Hierarchie, strukturierte Daten (Product, Offer, BreadcrumbList, Organization, FAQ), Open Graph und Twitter Cards, sprechende Bild-Alt-Texte, Canonical- und Robots-Unterstützung.
- **Google PageSpeed / Core Web Vitals** (geplant): Ziel mobil: Lighthouse ≥ 95. LCP-Bild priorisiert, Lazy-Loading, feste Bildverhältnisse (kein Layout-Sprung), kritisches CSS, kein blockierendes JavaScript, WebP/AVIF, Schriften vorgeladen, kleines JS-Budget.

### Recht und Datenschutz

- **Rechtssicher in DE und EU** (geplant): Gesamtkonzept: keine externen Ressourcen ohne Einwilligung, Pflichtangaben an der richtigen Stelle, dokumentierte Prüfliste je Release. Hinweis: technische Umsetzung, keine Rechtsberatung; Texte und Einsatz anwaltlich prüfen lassen. _Recht:_ Rechtsstände (DSGVO, TDDDG, UWG, PAngV, BGB, BFSG, GPSR, KI-Verordnung) vor jedem Release prüfen und in der Doku mit Datum festhalten.
- **Einwilligungs-Schnittstelle (TDDDG)** (in Arbeit): Nichts von Dritten wird ohne Einwilligung geladen (2-Klick-Lösung für Videos, Karten, Social). Anbindung an gängige Consent-Manager und die Consent-Funktionen von JTL-Shop und Shopware. _Recht:_ § 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO.
- **Pflichtangaben und Preisdarstellung** (in Arbeit): Preise mit „inkl. MwSt. zzgl. Versand“, Grundpreis, Streichpreise mit dem niedrigsten Preis der letzten 30 Tage, Lieferzeit und Versandkosten-Link. _Recht:_ Preisangabenverordnung (PAngV, u. a. § 11), UWG.
- **Widerrufsfunktion und Bestellbutton** (in Arbeit): Gut erreichbare Widerrufsfunktion („Widerrufsbutton“) und korrekt beschrifteter Bestellbutton („zahlungspflichtig bestellen“). _Recht:_ Richtlinie (EU) 2023/2673, Umsetzung in § 356a BGB ab 19.06.2026 (Stand prüfen); § 312j BGB.
- **GPSR-Produktsicherheit** (in Arbeit): Felder und Anzeige für Hersteller, verantwortliche Person in der EU, Kontakt und Sicherheitshinweise auf der Artikelseite. _Recht:_ Verordnung (EU) 2023/988 (GPSR), seit 13.12.2024.
- **KI-Kennzeichnung** (als Plugin vorhanden, Einbindung offen): Transparente Kennzeichnung KI-erzeugter oder KI-bearbeiteter Bilder, ohne Originale zu verändern und ohne Daten an Dritte zu senden. Wird als Funktion des Themes eingebunden. _Recht:_ KI-Verordnung (EU) 2024/1689, Art. 50 (Transparenzpflichten); keine automatische Erkennung, Entscheidung bleibt beim Menschen.
- **EU-Garantie- und Gewährleistungshinweise** (in Arbeit): Harmonisierter EU-Gewährleistungshinweis und Garantie-Label (lokal ausgeliefert), an Artikelseite, Warenkorb und vor dem Bestellbutton. _Recht:_ Richtlinie (EU) 2024/825 (Anwendung ab 27.09.2026), Umsetzung in nationales Recht prüfen.
- **Ausverkauft-Konfiguration** (in Arbeit): Ausverkaufte Artikel sichtbar lassen, eindeutig kennzeichnen und kontrolliert vom Kauf ausschließen (SEO und Information).
- **EU- und DE-konforme Statistik (Datenschutz)** (geplant): Cookielose, anonyme Basisstatistik (Seitenaufrufe, Quellen, Warenkorb- und Bestellquote) ohne Weitergabe an Dritte, ohne IP-Speicherung, Auswertung im eigenen Backend, Auto-Löschung. _Recht:_ Ohne Endgeräte-Zugriff und ohne personenbezogene Daten ist keine Einwilligung nötig; Konzept dokumentieren und prüfen lassen (TDDDG, DSGVO).
- **Keine Drittanbieter-Ressourcen** (in Arbeit): Videos (YouTube nur nach Klick, nocookie), Karten (nur nach Klick), Icons und Schriften lokal. Teilen über einfache Links statt Social-Plugins. _Recht:_ TDDDG, DSGVO Kap. V (Drittlandübermittlung).
- **Rechtstext-Platzhalter und Hinweise** (geplant): Textbausteine und Hinweise für Impressum, Datenschutz, AGB, Widerruf, Verbraucherstreitbeilegung als Entwurf; Zuordnung zu den Shop-Seiten. _Recht:_ Texte immer von Anwältin oder Anwalt bzw. Rechtstext-Dienst erstellen lassen.

### Barrierefreiheit

- **Barrierefreiheit (BFSG / WCAG 2.2 AA)** (in Arbeit): Tastaturbedienung, sichtbarer Fokus, Kontraste, Skip-Link, Beschriftungen, Reduced-Motion, Screenreader-Texte, Vorlage für die Barrierefreiheitserklärung. _Recht:_ Barrierefreiheitsstärkungsgesetz (BFSG), seit 28.06.2025 für Online-Shops mit Verbrauchern; Ausnahmen für Kleinstunternehmen prüfen.

### Plattform und Betrieb

- **Plugin: Einstellungsseite** (fertig): Übersichtliche Einstellungsseite im Plugin MichaThemeV5: Gruppen, Suche, Einfach/Experte, Filter „Nur geänderte“ und „Nur Pflichtangaben“, Live-Hinweise, Zurücksetzen je Feld und Gruppe, Speichern mit Sicherung. Gleicher Speicher wie das Theme, nichts geht verloren. Fertig für WooCommerce und Shopware (Admin-Modul, Version 0.5.1); JTL in Arbeit, Shopify bleibt im Theme-Editor.
- **Plugin: Lizenzseite** (fertig): Lizenzcode einfügen, Status (Free, Pro, abgelaufen, falsche Domain, Server nicht erreichbar), „Jetzt prüfen“ und Link zum Kauf. Der Shop bricht nie, bei Fehlern gilt Free. Der Code wird nie im Klartext angezeigt. Fertig für WooCommerce und Shopware (Version 0.5.1).
- **Plugin: Plugin-Empfehlungen** (fertig): Liste weiterer Plugins aus dem Katalog von theme.michael-gahn.de, nur im Admin, mit Zwischenspeicher, leisen Fehlern und Aktualisieren höchstens einmal pro Minute. Nichts wird automatisch installiert. Fertig für WooCommerce und Shopware (Version 0.5.1).

