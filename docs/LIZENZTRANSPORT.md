# Lizenztransport – Entwicklungsstand 09.11.2026

Die Lizenzprüfung verwendet POST über HTTPS, den Lizenz-Token ausschließlich im
Autorisierungsheader und die Domain im JSON-Body. Zertifikat und Host werden geprüft,
Weiterleitungen unterbunden. Es gibt keine Ausweichanfrage mit Token in der URL.

Theme und Begleitplugin erhalten denselben geprüften Lizenzkern; ihre HTTP-Hüllen
müssen zusammen aktualisiert werden. Vor einer Veröffentlichung muss die Plattform
POST unterstützen und der Wechsel bestehender Installationen abgestimmt werden.
Dieser Entwicklungsstand ist noch kein neuer Release und kein Live-Nachweis.

Cache bis 24 Stunden und Gnadenfrist bei Serverausfällen bleiben erhalten. Ungültige,
widerrufene oder domainfremde Lizenzen schalten keine Pro-Funktionen frei.
Free-Funktionen werden durch diesen Transportwechsel nicht beschränkt.

Keine Lizenz-Tokens in Screenshots, Debug-Ausgaben, Supportmeldungen oder Request-
Protokolle kopieren. HTTPS schützt die Übertragung; eine JWT-Signatur verschlüsselt
keine enthaltenen Angaben. Der private Signaturschlüssel bleibt ausschließlich auf
der Lizenzplattform und gehört niemals in dieses Repository.

Ein Dateifingerprint auf einem vom Betreiber kontrollierten PHP-Server ist kein
fälschungssicherer Manipulationsnachweis. Dieser Patch führt weder Fernkontrolle,
automatische Vertragsstrafen noch einen neuen Melde-/E-Mail-Versand ein.
