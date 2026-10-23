# Version 0.2.2

Das Release-ZIP enthält alle benötigten Plugin-Dateien einschließlich fertiger CSS-/JavaScript-Dateien. Upload und GitHub-Update verwenden dasselbe geprüfte Paket. Ein manueller Administration- oder Node-Build entfällt.

Die Release-Pipeline prüft PHP, Paketinhalt, Asset-Verweise und Build-Prüfsummen. Veraltete oder veränderte Build-Dateien werden beim lokalen Verpacken abgewiesen; GitHub baut die Styles bei jedem Release frisch.

Neu: optionaler GitHub-Updater mit festem Repository, SHA-256-Prüfung, sicherer ZIP-Prüfung, privater Sicherung und Rückfall bei Fehlern. Automatik bleibt standardmäßig aus. Diese Version zunächst einmal per ZIP installieren.

Nach dem Upload bzw. der automatischen Vorbereitung unter „Erweiterungen → Meine Erweiterungen“ den normalen Shopware-Updatevorgang ausführen. Shopware übernimmt dabei seine Asset- und Cache-Schritte. Für automatische Prüfungen den Schalter in den Plugin-Einstellungen global aktivieren; ScheduledTask-Scheduler und Queue-Worker müssen laufen. Wegen der kurzen Verzeichnis-Umschaltung ein Wartungsfenster verwenden. Eine Shop-Sicherung vor Updates bleibt empfohlen.

Das Theme bleibt Pre-Alpha. Seine eigenen Styles, Skripte und Schriften liegen bereits fertig im Paket. Die normale Shopware-Theme-Zuweisung bzw. Theme-Kompilierung für den jeweiligen Verkaufskanal bleibt Teil von Shopware und wird nicht durch ein universelles all.css ersetzt.
