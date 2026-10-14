# ZippoWorkz Website (Webspace-Version)

Statische Website für den eigenen Webspace unter `zippoworkz.com`. Ersetzt die Higgsfield-Seite `zippoworkz.higgsfield.app`.

- Positionierung (Owner-Entscheidung 14.10.2026): Studio für betriebssichere KI-Workflows (Hauptgeschäft) plus Creator OS (zweites Standbein). Ansprache „wir“ = Inhaber + KI-Team. Rental Toolkit ist nicht mehr auf der Seite.
- `index.html`: Startseite mit Anfrage-Autopilot (1.490 €, Umfang aus `zippoworkz/sales/ANFRAGE_AUTOPILOT_499.md`), Betreuung, Creator OS. Zahlen und Tools nur aus `zippoworkz/career/FACTS.md`.
- `demo.html`: **Kundencenter-Demo** (`assets/portal.js`) mit Tickets, Freigaben, Automationen, Testlauf (`assets/flow.js`), Berichten und Dokumenten. Beispieldaten eines erfundenen Kunden, `noindex`, nicht in Hauptnavigation und Sitemap, nur über den Abschnitt „Betreuung“ und den Footer erreichbar.
- Rechtstexte, `404.html`, `llms.txt`, `sitemap.xml`, `robots.txt`, `.htaccess`, `assets/og.png`.
- Die Demo ordnet mit einfachen Regeln ein und läuft komplett im Browser. Es wird nichts gesendet oder gespeichert.

- Reines HTML/CSS/JS, keine Build-Tools, keine externen Requests (Schrift selbst gehostet, keine Cookies, kein Tracking).
- `.htaccess` für Apache-Webspace (z. B. IONOS): HTTPS, ohne www, Adressen ohne `.html`, Sicherheits-Header, Caching.
- Hochladen: Inhalt von `zippoworkz-webspace.zip` (bzw. den Ordner ohne `.git`, `.claude`, `README.md`) in das Webspace-Root.

## Vor dem Livegang (Owner-Gates)

1. **Rechtstexte prüfen.** Impressum, Datenschutz, AGB und Widerruf wurden aus den bisherigen Texten neu aufgebaut (Stand 14.10.2026), nicht wörtlich kopiert. Mit den Higgsfield-Originalen abgleichen.
2. **Hosting im Datenschutz bestätigen.** Angenommen ist IONOS SE inkl. Auftragsverarbeitungsvertrag.
3. **Meta-App und TikTok-App:** Die hinterlegte Datenschutz-URL auf `https://zippoworkz.com/datenschutz` umstellen.
4. **E-Mail:** Kontakt läuft noch über `zippoworkz@proton.me`. Nach bestandenem Domain-Mail-Test auf die neue Adresse umstellen (Suchen/Ersetzen in allen `.html`).
5. **Preise (Vorschlag 14.10.2026, marktbasiert):** Anfrage-Autopilot 1.490 €, eigene Workflows ab 3.900 €, Betreuung 490 / 990 / ab 1.990 € pro Monat (angepasst 14.10.2026 an Marktspannen: Einrichtung ca. 1.500-5.000 $, Wartung leicht ca. 1.000-3.500 $/Monat laut Agentur-Preisübersichten, z. B. codewave.com/taskip.net; Richtwert, keine Primärquelle), 120 €/Std. Vor dem Livegang bestätigen; Sales-Dokument und Fiverr-Gig (149–699 USD) passen dann nicht mehr dazu. Ein echtes Kundenportal mit Login gibt es noch nicht.
6. **Anfrage-Autopilot:** Der Sales-Entwurf nennt Make/Zapier im Kundenkonto. Das ist auf der Seite bewusst nicht erwähnt, bis die technische Umsetzung entschieden ist.
7. **Higgsfield-Seite** danach per Weiterleitung auf `zippoworkz.com` umstellen.

`milo.html` ist unverändert (Weiterleitung für die TikTok-Entwickler-Seite) und muss vor dem Abschalten der Higgsfield-Seite neu angelegt werden.
