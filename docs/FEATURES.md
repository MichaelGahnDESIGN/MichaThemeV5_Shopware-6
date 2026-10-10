# Funktionen – Shopware 6

> Automatisch erzeugt aus `docs/features.json` des Repos MichaThemeV5-Pro. Nicht von Hand ändern.

**Aktivierung:** Pro-Funktionen werden im MichaTheme V5 automatisch aktiviert, sobald eine gültige Lizenz (Abo oder Einzelkauf) für die Domain vorliegt. Die freien Themes enthalten nur die Free-Funktionen und verweisen für Pro-Funktionen auf https://theme.michael-gahn.de. Der Kauf erfordert zwingend ein Konto dort.

> Alle rechtlichen Angaben sind technische Hinweise zum Stand der Erstellung und keine Rechtsberatung. Vor Veröffentlichung von einer Anwältin oder einem Anwalt prüfen lassen.

Status: **planned** = geplant · **in_progress** = in Arbeit · **existing** = als Plugin vorhanden, Einbindung offen · **done** = fertig · **n/a** = nicht vorgesehen

## Free (im Theme enthalten)

### Design und Konfiguration

- **Farben über Variablen** (in Arbeit): Alle Farben als CSS-Variablen: Presets, Akzentfarbe, eigene Werte; getrennte Werte für Hell und Dunkel.
- **Hell-, Dunkel- und Systemmodus** (in Arbeit): Folgt dem Gerät oder per Schalter im Shop; beide Modi auf Kontrast geprüft (WCAG AA), kein Aufblitzen beim Laden.
- **Einfach- und Experten-Konfigurator** (in Arbeit): Wenige Schlüsseloptionen für Einsteiger, alle Optionen für Profis. Gliederung: Tab, Gruppe, Abschnitt, Feld. Eine gemeinsame Optionsdefinition erzeugt die Konfiguration aller drei Plattformen.
- **Lokale Schriften** (in Arbeit): Lokal eingebettete Schriften (WOFF2, offene Lizenzen): Arial/Helvetica als Systemschrift, Roboto, Open Sans, Inter, Lato, Montserrat, Source Sans 3, Nunito, Merriweather, Playfair Display. Kein Abruf bei Google oder CDNs. _Recht:_ Externe Schriftdienste sind ohne Einwilligung datenschutzrechtlich riskant (u. a. LG München I, Az. 3 O 17493/20); lokale Einbettung ist die sichere Lösung. Schriftlizenzen (OFL) mitliefern.
- **Logo** (in Arbeit): Logo mit Hell-/Dunkel-Variante, SVG und Retina, Größe und Alt-Text einstellbar, Favicon und Touch-Icon.
- **Verschiedene Header** (in Arbeit): Mehrere Header-Layouts (klassisch, zentriert, kompakt), Ankündigungsleiste, optional fixierter Header, Suchfeld-Varianten.
- **Verschiedene Footer** (in Arbeit): Mehrere Footer-Layouts (4-spaltig, 3-spaltig, minimal), Rechtslinks, Zahlungs- und Versandarten, Newsletter-Feld (mit Double-Opt-In). _Recht:_ Pflichtlinks (Impressum, Datenschutz, AGB, Widerruf) immer sichtbar und in jedem Footer-Layout enthalten.
- **Layouts für Kategorie- und Artikellisten** (in Arbeit): Raster mit 2 bis 5 Spalten, Listenansicht, Filter links oder oben, Kartenstile (flach, Rahmen, Schatten), Bildverhältnis, Hover-Effekte.
- **Layouts für Artikel-Detailseiten** (in Arbeit): Galerie links oder unten, fixierte Kaufbox, Tabs oder Akkordeon, Vertrauenselemente, verwandte Artikel.
- **Designvariante „Basis“** (geplant): Eine fertige Designvariante im Free-Theme; weitere Varianten sind Premium (siehe Themes).

### Inhalte und Erlebniswelten

- **Erlebniswelten und Blueprints mit 1-Klick-Demo** (geplant): Professionelle Vorlagen (Startseite, Kategorie, Landingpages) mit kostenloser 1-Klick-Demoinstallation und vielfältigen CMS-Elementen. JTL: Blueprints im OPC; Shopware: Erlebniswelten; WooCommerce: Block-Patterns und Seitenvorlagen.
- **CMS-Elemente** (geplant): Eigene Elemente: JTL-Portlets, Shopware-Blöcke, WooCommerce-Blöcke/Patterns (Hero, Kategorie-Kacheln, Produkt-Slider, Vorteile, FAQ, Testimonials, Newsletter, Marken-Leiste).

### SEO und Geschwindigkeit

- **SEO-Optimierung** (geplant): Semantisches HTML, saubere Überschriften-Hierarchie, strukturierte Daten (Product, Offer, BreadcrumbList, Organization, FAQ), Open Graph und Twitter Cards, sprechende Bild-Alt-Texte, Canonical- und Robots-Unterstützung.
- **Google PageSpeed / Core Web Vitals** (geplant): Ziel mobil: Lighthouse ≥ 95. LCP-Bild priorisiert, Lazy-Loading, feste Bildverhältnisse (kein Layout-Sprung), kritisches CSS, kein blockierendes JavaScript, WebP/AVIF, Schriften vorgeladen, kleines JS-Budget.

### Recht und Datenschutz

- **Rechtssicher in DE und EU** (geplant): Gesamtkonzept: keine externen Ressourcen ohne Einwilligung, Pflichtangaben an der richtigen Stelle, dokumentierte Prüfliste je Release. Hinweis: technische Umsetzung, keine Rechtsberatung; Texte und Einsatz anwaltlich prüfen lassen. _Recht:_ Rechtsstände (DSGVO, TDDDG, UWG, PAngV, BGB, BFSG, GPSR, KI-Verordnung) vor jedem Release prüfen und in der Doku mit Datum festhalten.
- **Einwilligungs-Schnittstelle (TDDDG)** (geplant): Nichts von Dritten wird ohne Einwilligung geladen (2-Klick-Lösung für Videos, Karten, Social). Anbindung an gängige Consent-Manager und die Consent-Funktionen von JTL-Shop und Shopware. _Recht:_ § 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO.
- **Pflichtangaben und Preisdarstellung** (in Arbeit): Preise mit „inkl. MwSt. zzgl. Versand“, Grundpreis, Streichpreise mit dem niedrigsten Preis der letzten 30 Tage, Lieferzeit und Versandkosten-Link. _Recht:_ Preisangabenverordnung (PAngV, u. a. § 11), UWG.
- **Widerrufsfunktion und Bestellbutton** (geplant): Gut erreichbare Widerrufsfunktion („Widerrufsbutton“) und korrekt beschrifteter Bestellbutton („zahlungspflichtig bestellen“). _Recht:_ Richtlinie (EU) 2023/2673, Umsetzung in § 356a BGB ab 19.06.2026 (Stand prüfen); § 312j BGB.
- **GPSR-Produktsicherheit** (geplant): Felder und Anzeige für Hersteller, verantwortliche Person in der EU, Kontakt und Sicherheitshinweise auf der Artikelseite. _Recht:_ Verordnung (EU) 2023/988 (GPSR), seit 13.12.2024.
- **KI-Kennzeichnung** (als Plugin vorhanden, Einbindung offen): Transparente Kennzeichnung KI-erzeugter oder KI-bearbeiteter Bilder, ohne Originale zu verändern und ohne Daten an Dritte zu senden. Wird als Funktion des Themes eingebunden. _Recht:_ KI-Verordnung (EU) 2024/1689, Art. 50 (Transparenzpflichten); keine automatische Erkennung, Entscheidung bleibt beim Menschen.
- **EU-Garantie- und Gewährleistungshinweise** (als Plugin vorhanden, Einbindung offen): Harmonisierter EU-Gewährleistungshinweis und Garantie-Label (lokal ausgeliefert), an Artikelseite, Warenkorb und vor dem Bestellbutton. _Recht:_ Richtlinie (EU) 2024/825 (Anwendung ab 27.09.2026), Umsetzung in nationales Recht prüfen.
- **Ausverkauft-Konfiguration** (als Plugin vorhanden, Einbindung offen): Ausverkaufte Artikel sichtbar lassen, eindeutig kennzeichnen und kontrolliert vom Kauf ausschließen (SEO und Information).
- **EU- und DE-konforme Statistik (Datenschutz)** (geplant): Cookielose, anonyme Basisstatistik (Seitenaufrufe, Quellen, Warenkorb- und Bestellquote) ohne Weitergabe an Dritte, ohne IP-Speicherung, Auswertung im eigenen Backend, Auto-Löschung. _Recht:_ Ohne Endgeräte-Zugriff und ohne personenbezogene Daten ist keine Einwilligung nötig; Konzept dokumentieren und prüfen lassen (TDDDG, DSGVO).
- **Keine Drittanbieter-Ressourcen** (in Arbeit): Videos (YouTube nur nach Klick, nocookie), Karten (nur nach Klick), Icons und Schriften lokal. Teilen über einfache Links statt Social-Plugins. _Recht:_ TDDDG, DSGVO Kap. V (Drittlandübermittlung).
- **Rechtstext-Platzhalter und Hinweise** (geplant): Textbausteine und Hinweise für Impressum, Datenschutz, AGB, Widerruf, Verbraucherstreitbeilegung als Entwurf; Zuordnung zu den Shop-Seiten. _Recht:_ Texte immer von Anwältin oder Anwalt bzw. Rechtstext-Dienst erstellen lassen.

### Barrierefreiheit

- **Barrierefreiheit (BFSG / WCAG 2.2 AA)** (geplant): Tastaturbedienung, sichtbarer Fokus, Kontraste, Skip-Link, Beschriftungen, Reduced-Motion, Screenreader-Texte, Vorlage für die Barrierefreiheitserklärung. _Recht:_ Barrierefreiheitsstärkungsgesetz (BFSG), seit 28.06.2025 für Online-Shops mit Verbrauchern; Ausnahmen für Kleinstunternehmen prüfen.

## Pro (einzeln kaufen oder im Abo, Freischaltung per Lizenz)

### Premium-Funktionen

- **Weitere Themes und Designvarianten** (geplant): Zusätzliche fertige Designvarianten (Branchen-Presets), einzeln kaufbar oder im Abo.
- **Eigenes HTML, CSS und JavaScript** (in Arbeit): Eigener Code an definierten Stellen (Kopf, Fuß, pro Seite) mit Rollenrechten, Versionsverlauf und Notausschalter; JavaScript nur nach Einwilligungskategorie. _Recht:_ Eingebundene Skripte Dritter unterliegen dem TDDDG; Verantwortung liegt beim Shopbetreiber, Hinweis im Backend.
- **Conversion-Rate-Optimierung** (geplant): A/B-Tests für Theme-Elemente, Trichter-Auswertung, Hinweise zu Hürden im Checkout; datensparsam und ohne Cookies, wo möglich. _Recht:_ Tests mit personenbezogenen Daten nur mit Rechtsgrundlage; Standard: anonym.
- **Bonuspunkte** (geplant): Treueprogramm: Punkte sammeln und einlösen, Kontostand im Kundenkonto, Verfall und Bedingungen transparent. _Recht:_ Bedingungen im Programm und in den AGB; Datenschutzhinweis; Rabatt- und Preisregeln (PAngV, UWG) beachten.
- **WhatsApp-Chat** (geplant): Chat-Schaltfläche, die Meta erst nach Klick und Hinweis kontaktiert (kein vorab geladenes Widget), Öffnungszeiten, vorbereitete Nachricht. _Recht:_ TDDDG/DSGVO: keine Verbindung zu Meta vor Einwilligung bzw. Klick; Drittland-Hinweis in der Datenschutzerklärung.
- **WhatsApp-Newsletter** (geplant): Anmeldung mit nachweisbarem Double-Opt-In, Abmeldung per Klick, Protokoll der Einwilligung, Versand über Business-API-Anbieter mit Auftragsverarbeitung. _Recht:_ UWG § 7 (Einwilligung), DSGVO; Nachweispflicht der Einwilligung.
- **Live-Sale-Benachrichtigung** (geplant): Hinweise auf echte, anonymisierte Käufe („Jemand aus Hamburg hat … gekauft“); Opt-out, keine erfundenen Meldungen. _Recht:_ Gefälschte Social-Proof-Meldungen sind irreführend (UWG); nur echte Daten, ohne Rückschluss auf Personen.
- **Google-Rezensionen** (geplant): Bewertungen serverseitig abrufen und zwischenspeichern, ohne dass Besucher Google kontaktieren; Kennzeichnung der Quelle; strukturierte Daten nur wo erlaubt. _Recht:_ Nutzungsbedingungen der Google-APIs; Bewertungen nicht verfälschen oder selektiv filtern (UWG).
- **Rabattanzeige und Angebots-Countdown** (in Arbeit): Rabatt in Prozent und Betrag, optional Countdown; Streichpreis mit niedrigstem Preis der letzten 30 Tage. _Recht:_ PAngV § 11; Countdown nur bei echter Befristung (UWG, keine künstliche Verknappung).
- **Wiederbestellen** (geplant): Frühere Bestellung mit einem Klick erneut in den Warenkorb legen, Verfügbarkeit und aktuelle Preise werden geprüft.
- **Versandkosten-Fortschrittsbalken** (in Arbeit): Zeigt, wie viel bis zur versandkostenfreien Lieferung fehlt. _Recht:_ Angaben müssen mit den Versandbedingungen übereinstimmen (PAngV).
- **Bestands-Fortschrittsbalken** (in Arbeit): Zeigt den echten Lagerbestand als Balken. _Recht:_ Nur echte Bestände; keine künstliche Verknappung (UWG Anhang Nr. 7).
- **Checkout-Motivation** (geplant): Vertrauens- und Hilfetexte, Fortschritt im Checkout, Abbruch-Hinweise ohne Druck. _Recht:_ Keine manipulativen Muster (Dark Patterns), Hinweise des DSA beachten.
- **Liefer- und Versandanzeige** (in Arbeit): Voraussichtliches Lieferdatum mit Bestellschluss, je Versandart und Land. _Recht:_ Lieferzeitangaben müssen verbindlich und zutreffend sein (UWG, PAngV).
- **Adventskalender** (geplant): Türchen mit Aktionen, Zeitplan, Gutscheine; barrierefrei und ohne Tracking. _Recht:_ Bei Gewinnen: Teilnahmebedingungen und Datenschutzhinweise.
- **Gewinnspiel** (geplant): Rechtssichere Gewinnspiele: Teilnahmebedingungen, Altersgrenze, Datenschutzhinweis, Kopplungsverbot, nachvollziehbare Auslosung, Löschfristen. _Recht:_ UWG, DSGVO, Glücksspielrecht (kein Einsatz verlangen), Teilnahmebedingungen anwaltlich prüfen.
- **EU-Energielabels** (geplant): Energielabel und Produktdatenblatt aus der EPREL-Datenbank, Pfeil-Label auf Artikelseite und in Listen. _Recht:_ Delegierte Verordnungen zur Energieverbrauchskennzeichnung (EU) 2017/1369 und produktspezifisch.
- **Special FX** (geplant): Schnee, Regen und weitere Effekte; abschaltbar, respektiert Reduced-Motion, kein Blitzen. _Recht:_ WCAG 2.3.1 (keine Blitze), Barrierefreiheit; Besucher können Effekte ausschalten.
- **Smarte Suche** (geplant): Vorschläge, Fehlertoleranz, Synonyme, Filter in der Suche; läuft im Shop ohne Drittanbieter, anonyme Suchstatistik.
- **Erweiterte Statistiken** (geplant): Erweiterung der kostenlosen Statistik: Trichter, Kampagnen, Produktleistung, Export; weiterhin cookielos und ohne Dritte. _Recht:_ Wie die kostenlose Statistik; Dokumentation anpassen.
- **Popup-Manager** (in Arbeit): Regeln, Häufigkeitsgrenzen, Zeitpläne; barrierefrei, ohne aufdringliche Vollbild-Einblendungen auf Mobilgeräten. _Recht:_ Nur mit Rechtsgrundlage für verarbeitete Daten; Google-Richtlinien zu Interstitials beachten.
- **Mega-Menü** (geplant): Mehrspaltiges Menü mit Bildern und Hervorhebungen.
- **Schnellansicht** (geplant): Artikel in der Liste in einem Dialog ansehen und in den Warenkorb legen.
- **Cross-Selling und Bundles** (geplant): Zubehör, „Oft zusammen gekauft“, Bundle-Rabatte. _Recht:_ Preisangaben nach PAngV.
- **Wieder-verfügbar-Benachrichtigung** (geplant): E-Mail bei Wiederverfügbarkeit mit Double-Opt-In und Löschfrist. _Recht:_ Nur mit Einwilligung (UWG § 7), Nachweis speichern.
- **B2B-Funktionen** (geplant): Kundengruppenpreise, Staffelpreise, Mindestmengen, USt-ID-Prüfung beim Kauf.
- **Bewertungsportale** (geplant): Anbindung von Trusted Shops, eKomi, ProvenExpert u. a. mit Einwilligung und Zwischenspeicher. _Recht:_ Einwilligung, echte Bewertungen kennzeichnen (UWG § 5b).
- **Warenkorb-Erinnerung** (geplant): Erinnerungs-E-Mail nur mit Einwilligung, einfache Abmeldung. _Recht:_ UWG § 7: Einwilligung nötig.

