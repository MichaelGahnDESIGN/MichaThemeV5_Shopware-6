# Threat-Model v0.3 – MichaTheme V5 Pro
**Status:** Final nach Review (Opus v0.2 + E1-E7 Entscheidungen)  
**Datum:** 2026-10-01  
**Gültig für:** JTL-Shop 5 & Shopware 6 Theme + SaaS-Plattform

---

## 1. Architektur-Entscheidungen (E1-E7)

| Entscheidung | Beschreibung |
|---|---|
| **E1** | **Technischer Puffer (7 Tage):** Premium bleibt aktiv bis Ende der Stripe-Retry-Phase; Downgrade erst bei `status=unpaid/canceled` |
| **E2** | **Testphase:** Erfordert Zahlungsmittel + verifizierte Firmen-Registrierung; 1 Test pro USt-ID/Domain/Zahlungsmittel-Fingerprint |
| **E3** | **2FA für Admin:** Optional, aber konfigurierbar im Admin-Backoffice (global oder je Rolle) |
| **E4** | **Sicherheits-Emails:** Transaktionsmailer + Fallback auf PHP mail() |
| **E5** | **Security Updates:** Kostenlos für alle (unabhängig von Abo-Status); nur Module/Support kosten |
| **E6** | **Ausfalltoleranz:** Graceful Degradation + 24h Offline-Cache für Lizenz-/VIES-Lookups |
| **E7** | **Package-Signing:** Entfällt; Theme privat auf Repo + all-inkl Download-Gate; Zwei-Schlüssel-Strategie (Root + License-Key) |

---

## 2. Deployment-Modell

- **GitHub Repo:** Privat (nur Michael + Entwickler)
- **Staging:** Docker lokal
- **Production:** all-inkl.com (PHP 8.5, SSH, Cronjobs max. 1, SFTP mit separatem User)
- **Download-Gate:** SaaS-Plattform nur; kein öffentliches Theme-Repo

---

## 3. Kritische Sicherheitsanforderungen

### 3.1 Schlüssel-Strategie (K1 fixed)

**Zwei-Schlüssel-Architektur** (statt drei):

| Schlüssel | Speicherort | Benutzer | Zweck |
|---|---|---|---|
| **Root-Key (Ed25519)** | Offline (Hardware-Token oder lokal) | Michael | Signiert License-Key-Liste + Widerrufliste (CRL) |
| **License-Key (Ed25519)** | Server, verschlüsselt mit Age | SaaS-Backend | Signiert Lizenz-Token für Kunden (TTL 90 Tage) |

**Nicht mehr nötig:**
- Package-Signing-Key (Repo privat, Updates vom Server direkt)

**Implementierung:**
- Root-Key nur lokal/Offline verfügbar; nie auf Server
- License-Key verschlüsselt mit `age` auf Server; wird nur bei Lizenz-Issuance dekryptiert (in-Memory)
- Theme hat nur Root-Public-Key hardcodiert
- License-Key-Liste (signiert von Root) abrufbar; enthält `kid`, `pub`, `exp`, `purpose`
- Sperrliste (CRL) über Cron täglich erneuert

---

### 3.2 Update-Kanal & Manifest (K2 fixed)

**Signiertes Manifest je Release:**

```json
{
  "product": "michatheme-v5-pro",
  "platform": "shopware6" | "jtl5",
  "version": "1.0.0",
  "channel": "stable" | "beta",
  "released_at": "2026-10-01T12:00:00Z",
  "sha256": "abc123...",
  "min_client": "0.0.1",
  "expires": "2026-10-15T12:00:00Z",
  "signature": "ed25519(manifest)"
}
```

**Client akzeptiert nur:**
- ✅ Richtige `product` + `platform`
- ✅ `version > installiert` ODER explizites Rollback-Manifest
- ✅ `released_at` im signierten Manifest
- ✅ Manifest nicht abgelaufen (`expires`)
- ❌ Alte verwundbare Versionen
- ❌ Falsche Plattform/Produkt

---

### 3.3 Zahlungs-Zustandsautomat (K5 fixed, H2)

**Status-Fluss mit E1 Technical Buffer:**

```
Active (zahlend)
  ├─ past_due (Zahlungsfehler, aber Stripe retried noch) → Premium aktiv
  │  └─ 7-Tage-Puffer bis Stripe retry-Phase vorbei
  ├─ unpaid → Downgrade zu Free
  ├─ canceled → Downgrade zu Free
  └─ incomplete_expired → Downgrade zu Free

Trial (Testphase mit Zahlungsmittel)
  ├─ active → Konvertierung
  └─ trial_ended → Downgrade zu Free

Dispute/Refund (außergewöhnlich)
  ├─ disputed → Premium sperren, Audit
  ├─ refunded (voll) → Downgrade zu Free, Audit
  └─ charge.dispute.created → sofortige Entitlement-Entzug

Token-Gültigkeit:
  - Abo: exp = period_end + 7 Tage (E1)
  - Einmalkauf: exp = 90 Tage rollierend (Online-Check erneuert)
```

**Webhook-Verifizierung (H5):**
- ✅ `signature` mit Webhook-Secret geprüft
- ✅ `event.id` vor Bearbeitung in DB prüfen (Duplicate-Schutz)
- ✅ `livemode` passt zur Umgebung (Test/Live getrennt)
- ✅ `payment_status=paid` ODER `invoice.paid` (asynchron, H1)
- ✅ Entitlement erst nach `paid` / `invoice.paid`
- ✅ Konto-Zuordnung nur über serverseitig erzeugte `client_reference_id`
- ✅ `payment_behavior=pending_if_incomplete` bei Upgrades
- ✅ Tier/Module nur aus Price-ID-Allowlist

---

### 3.4 Lizenz-Tokens (K4 fixed, H10)

```json
{
  "id": "lic_xxxxx128bit",      // Zufällig, ≥128 Bit
  "product": "michatheme-v5-pro",
  "platform": "shopware6" | "jtl5",
  "domain": "example.com",       // Normalisiert: lowercase, IDNA, kein Port
  "tier": "free" | "plus" | "pro" | "agency",
  "modules": ["module-1", "module-2"],
  "exp": 1735689600,            // Abo: period_end + 7d; Einmalkauf: 90d rolling
  "iat": 1700000000,
  "signature": "ed25519(payload)"
}
```

**Domain-Normalisierung (H11):**
- Lowercase, IDNA/Punycode, trailing dot entfernt, `www` explizit
- Staging: max. 2 Instanzen je Lizenz (Regex: `staging.*`, `*.test`, localhost)
- Domain-Wechsel: max. N/Jahr (Cooldown); alte Lizenz-ID in CRL

**Aktivierung & Umzug (H10 fixed, T28):**
- ❌ Nur mit Lizenz-Key + Domain = nicht sicher
- ✅ Nur aus angemeldetes Kundenkonto ODER mit dort erzeugtem Einmal-Code
- ✅ Mail-Benachrichtigung bei Umzug, Download, Kündigung
- ✅ Konto-2FA optional für Kunden

---

### 3.5 Testphase (H3 fixed, E2)

**Anforderungen (E2):**
- ✅ Zahlungsmittel erforderlich (auch für Trial)
- ✅ Firmen-Registrierung verifiziert (USt-ID + VIES oder Gewerbe)
- ✅ 1 Test pro USt-ID / Domain / Zahlungsmittel-Fingerprint
- ✅ 14-30 Tage kostenlos
- ✅ Trial-Downloads protokolliert + Lizenz-ID wasserfest (im Download)

---

### 3.6 2FA & Admin-Sicherheit (H8 fixed, E3)

**TOTP (zeitbasiert):**
- ✅ Pflicht für **Superadmin** (immer)
- ⚙️ Optional für **Admin** (konfigurierbar E3)
- ✅ Email-Code nur für **Moderator** (einfacher, aber Recovery-Mail Risiko)

**Session-Isolation:**
- ✅ Backoffice auf eigenem Cookie (Path/Subdomain)
- ✅ Entwurfsansicht ohne Backoffice-Session-Rechte
- ✅ CMS/GrapesJS-Content sichtbar, aber nicht editierbar

**Passwort-Reset (H8):**
- ✅ Reset setzt 2FA NICHT zurück
- ✅ 2FA-Reset nur durch Superadmin + Audit
- ✅ Break-Glass-Verfahren: Recovery-Codes offline verwahrt

**Einladungen (H9):**
- ✅ Rolle im DB-Datensatz fixiert (nicht aus URL/Form)
- ✅ Nur Superadmin lädt Admin ein
- ✅ Einladung E-Mail-gebunden; Annahme erfordert 2FA vor Aktivierung
- ✅ Token-Laufzeit ≤ 24h
- ✅ Widerruf offener Einladungen

---

## 4. Datenschutz & Compliance

### 4.1 DSGVO (M8 fixed)

**Verarbeitung:**
- ✅ IP im Access-Log mit Rechtsgrundlage Art. 6(1)(f) + Speicherdauer (Hoster-Prüfung)
- ✅ Audit-Log personenbezogen (User-ID, IP für Nachweise), eigene Löschfrist
- ✅ Rechnungsdaten 8/10 Jahre (AO/HGB)
- ✅ Datenportals-Löschanspruch vs. Aufbewahrungspflicht gelöst

**Update-Check (M8):**
- ✅ Nur `domain`, `version`, `tier` übertragen
- ✅ NO IP-Collection oder Client-Fingerprinting
- ✅ Cron/Admin-Abfrage nur (keine Shop-Storefront-Requests)

### 4.2 Cookieless Analytics (M9)

**Datenschutz-konform:**
- ✅ IP + User-Agent → SHA256(IP + UA + täglicher Salt)
- ✅ Salt täglich zufällig, nie gespeichert/geloggt
- ✅ Keine clientseitigen Merkmale (Screen, Fonts, etc.)
- ✅ DSB-Prüfung als Gate (`privacy-reviewed`)
- ✅ Stripe Hosted Checkout (nicht Stripe.js auf eigener Domain)

### 4.3 B2B-Prüfung (M10)

**USt-ID-Verifikation:**
- ✅ VIES-Abfrage mit ID + Datum speichern
- ✅ Kleinunternehmer ohne USt-ID: Gewerbe/Handelsregister-Nachweis
- ✅ USt-ID-Änderung: nur für *künftige* Rechnungen + erneute Prüfung

---

## 5. Zahlungs-Backup & Fehlerbehandlung

### 5.1 Stripe-Portal Restrictions (H6)

**Kundenportal deaktiviert für:**
- ❌ Kündigung
- ❌ Planwechsel
- ✅ Zahlungsmittel-Update (für Retry)

**Erzwingung:**
- ✅ API `billing_portal.configuration` speichert Settings
- ✅ Screenshot als Gate-Beweis (`portal-settings-verified`)
- ✅ Täglicher Abgleich Stripe ↔ DB (Cron); Abweichung = Alarm
- ✅ Dashboard-Access: 2FA + Restricted Key (nur benötigte Rechte)

### 5.2 Ausfalltoleranz (E6, M1)

**Lizenz-Server-Ausfall:**
- < 30 Min: Premium bleibt aktiv (Cache + Last-Known-State)
- ≥ 30 Min: Fallback auf 24h Offline-Cache
- Cache-Ablauf: → Free-Tier
- Fehlerlog + Admin-Alert

**VIES-Ausfall:**
- < 30 Min: Registration/Renewal blockiert oder Fallback auf Cache
- ≥ 30 Min: Fallback auf letzte Abfrage (24h)
- Ablauf: → Entitlement-Entzug, Audit
- E-Mail an Kunden + Admin

**Strategien:**
- ✅ Lizenz-Check Cron-basiert (nicht Storefront)
- ✅ Token-`exp` lokal entscheidend (nie vom Cache überschrieben)
- ✅ Jitter im Client (2-5 Min random Delay bei Erneuern)

---

## 6. Shared-Hosting Hardening (M4)

### 6.1 Datei-Permissionen (all-inkl.com)

**PHP-Uploads blockieren:**
```apache
<FilesMatch "\.(php|phtml|phar|phps|php3|php4|php5|php6|php7|php8|shtml|pgif|spl|pht|phar|phpt)$">
  Deny from all
</FilesMatch>
```

**nicht `.htaccess` allein (wirkt nicht mit FPM/CGI).**

### 6.2 Session-Speicher

- ✅ Eigenes Verzeichnis `/tmp/sessions_{{ uuid }}/` (außerhalb Webroot)
- ✅ Berechtigungen 700 (nur PHP-User)

### 6.3 DB-Benutzer (Minimalprinzip)

- ✅ Getrennte User falls GRANT möglich
- ⚠️ Sonst: getrennte Datenbanken mit eigenen Accounts (KAS prüfen)
- ✅ Nur benötigte GRANTS (z. B. `SELECT, INSERT, UPDATE` auf `licensing_*`)

### 6.4 Cron & Laufzeiten

- ✅ all-inkl max. 1 Cron/account → externe Service nutzen (cron-job.org)
- ✅ Timeout für Lizenz-Sync: 5 Min, Fehlermail bei Timeout
- ✅ Rate-Limiting (DB/Datei-basiert, kein Redis)

---

## 7. Backup & Key-Verwaltung

### 7.1 Lokale Backups

- ✅ Nur verschlüsselt (Age-Encryption)
- ✅ Key getrennt, offline verwahrt (Michael nur)
- ✅ Nach Upload vom Server gelöscht
- ✅ Restore-Test als Gate (`backup-restore-tested`)

### 7.2 Hoster-Backups

- ✅ all-inkl-Backups in "Verarbeitungsverzeichnis" dokumentiert (TOM)
- ❌ Keine Offline-/Lizenz-Keys im Backup (E7: nur License-Key online, verschlüsselt)
- ✅ Separate SFTP-User nur für Deploy-Verzeichnis (falls möglich)

### 7.3 Root-Key Rotation (K3 fixed)

**Runbook (jährlich geübt):**
1. Neue Root-PK erzeugen
2. Alle License-Keys + CRL mit neuer PK signieren
3. Alte kid in Sperrliste (CRL) eintragen
4. Kunden benachrichtigen (Routine)
5. Alte Root-PK archivieren (offline)

---

## 8. CMS-Sicherheit (M6, M7)

### 8.1 Upload-Sanitizing (TinyMCE + GrapesJS)

- ✅ Sanitizing beim Speichern **und** beim Import/Restore
- ✅ CSS-Allowlist (nur häufige Eigenschaften)
- ✅ GrapesJS-Script-Komponenten deaktiviert
- ✅ `<iframe>`, `<embed>` mit Allowlist-Quellen
- ✅ kein `onclick`, `onerror`, `onload` in HTML

### 8.2 Content-Security-Policy

```
default-src 'self';
script-src 'self' 'nonce-{{ random }}';
style-src 'self' 'nonce-{{ random }}';
object-src 'none';
frame-ancestors 'none';
```

---

## 9. API-Sicherheit (M7)

### 9.1 Lizenz-API

- ✅ Rate-Limiting: 10 req/Min pro IP + Lizenz-ID
- ✅ Zufällige Lizenz-IDs (≥128 Bit, nie sequenziell)
- ✅ Keine Kundendaten ohne gültige Signatur
- ✅ Logging: nur `license_id`, `domain`, `platform` (keine IP in Query)

---

## 10. Email-Sicherheit (H3, E4, M5)

**Transport:**
- ✅ SMTP mit TLS (kein Fallback auf `mail()` Still)
- ✅ Mit E4: PHP `mail()` Fallback bei SMTP-Fehler
- ✅ Retry-Queue bei Fehler (kein stiller Fehler)
- ✅ Alarm bei 3x Fehler hintereinander

**Sicherheits-Emails (2FA, Reset, Lizenz):**
- ✅ Domain-DKIM signiert
- ✅ SPF/DMARC Record prüfen
- ✅ Kein Kunden-Branding (um Phishing zu vermeiden)

---

## 11. Gates & Audit-Checkliste

**Vor Go-Live:**
- [ ] `threat-model-reviewed` (Opus + Michael)
- [ ] `backup-restore-tested` (Lokaler Restore funktioniert)
- [ ] `portal-settings-verified` (Stripe Portal Screenshots)
- [ ] `b2b-abgrenzung-reviewed` (B2B-only, kein Verbraucher)
- [ ] `privacy-reviewed` (DSB-Check Analytics)
- [ ] `legal-reviewed` (Anwalt: AGB, Widerrufsrecht, DSGVO)
- [ ] `security-review-complete` (Penetration Test oder Code Review)
- [ ] `all-inkl-specs-verified` (SSH, PHP 8.5, Session-Dirs, Cron)

**Jährlich:**
- [ ] Root-Key-Rotation Runbook durchspielen
- [ ] VIES/Stripe-API-Änderungen prüfen
- [ ] Audit-Logs auf Anomalien reviewen
- [ ] Backup-Restore üben

---

## 12. Ausstehende Implementierungs-Entscheidungen

| Thema | Status |
|---|---|
| Monthly vs. Yearly Preise final | Pending (Vorschlag: 35/53/158€) |
| Markenfarbe (#cd1616) | Pending |
| PRs mergen | Pending |
| all-inkl.com SSH/Cronjob/SFTP-Details | Pending |
| Einmalkauf-Verlängerungslogik | Pending |
| Admin 2FA Enforcement-Modus | Entschieden (E3: konfigurierbar) |

---

**Versionshistorie:**
- v0.1: Initial Threat-Model (Opus-Review angestoßen)
- v0.2: Nach Opus-Review (5K + 11H + 12M Findings)
- v0.3: Nach E1-E7 + Private-Repo-Klarstellung + Zwei-Schlüssel (CURRENT)
