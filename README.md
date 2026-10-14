# Zippoworkz Website (Webspace-Version)

Statische Website für den eigenen Webspace unter `zippoworkz.com`. Ersetzt die Higgsfield-Seite `zippoworkz.higgsfield.app`.

- Reines HTML/CSS/JS, keine Build-Tools, keine externen Requests (Schrift selbst gehostet, keine Cookies, kein Tracking).
- `.htaccess` für Apache-Webspace (z. B. IONOS): HTTPS, ohne www, Adressen ohne `.html`, Sicherheits-Header, Caching.
- Hochladen: den kompletten Ordnerinhalt (ohne `.git`, `.claude`, `README.md`) in das Webspace-Root.

## Vor dem Livegang (Owner-Gates)

1. **Rechtstexte prüfen.** Impressum, Datenschutz, AGB und Widerruf wurden aus den bisherigen Texten neu aufgebaut (Stand 14.10.2026), nicht wörtlich kopiert. Mit den Higgsfield-Originalen abgleichen.
2. **Hosting im Datenschutz bestätigen.** Angenommen ist IONOS SE inkl. Auftragsverarbeitungsvertrag.
3. **Meta-App und TikTok-App:** Die hinterlegte Datenschutz-URL auf `https://zippoworkz.com/datenschutz` umstellen.
4. **E-Mail:** Kontakt läuft noch über `zippoworkz@proton.me`. Nach bestandenem Domain-Mail-Test auf die neue Adresse umstellen (Suchen/Ersetzen in allen `.html`).
5. **Higgsfield-Seite** danach per Weiterleitung auf `zippoworkz.com` umstellen.

`milo.html` ist unverändert (Weiterleitung für die TikTok-Entwickler-Seite) und muss vor dem Abschalten der Higgsfield-Seite neu angelegt werden.
