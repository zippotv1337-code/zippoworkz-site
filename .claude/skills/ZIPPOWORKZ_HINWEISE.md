# Design-Skills für zippoworkz-site

Vendored aus [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT), Commit `b482f7a`, unverändert:

| Ordner | Skill-Name | Wofür |
|---|---|---|
| `taste-skill/` | `design-taste-frontend` | Neue Sektionen oder Seiten (Landing, Case Study) |
| `redesign-skill/` | `redesign-existing-projects` | Bestehende Seiten verbessern, Audit zuerst |

Claude Code lädt beide automatisch, wenn in diesem Repo gearbeitet wird.

## Was für diese Seite gilt (hat Vorrang vor den Skills)

- **Stack bleibt statisches HTML/CSS** für GitHub Pages. Kein React/Next/Tailwind-Umbau, keine npm-Abhängigkeiten. Die React-/Motion-Beispiele der Skills nur sinngemäß in nativem CSS umsetzen.
- **Keine Platzhalterbilder** (picsum o. ä.) im Live-Stand. Nur eigene Assets aus `assets/`, kein Bild-Generator ohne Owner-Freigabe (Kosten-Gate).
- **Keine erfundenen Zahlen, Logos oder Kundenstimmen.** „Trusted by“-Wände nur mit echten Kunden und deren Erlaubnis.
- **Recht:** Impressum, Datenschutz und Nutzungsbedingungen, ihre URLs und die Consent-Texte werden nicht still geändert. Die Datenschutz-URL hängt an der Meta-App-Review.
- **Sprache Deutsch, Sie-/Du-Form wie im Bestand.** Der Gedankenstrich-Bann der Skill gilt für neue Texte. Bestehende Titel/Meta-Texte werden nur zusammen mit einem SEO-Check angepasst.
- **Deploy = Owner-Gate.** Änderungen laufen über Branch und PR, nie direkt auf `main`.

## Update

Neue Version holen: Repo klonen, `skills/taste-skill/SKILL.md` und `skills/redesign-skill/SKILL.md` lesen, Diff prüfen, dann hier ersetzen und den Commit oben anpassen.

## 21st.dev Magic (Komponenten-Generator, `.mcp.json`)

- Ist als MCP-Server `21st-magic` vorbereitet. Der Key kommt **nur aus der Umgebungsvariable `MAGIC_21ST_API_KEY`**, nie aus Git oder dem Chat.
- **Owner-Gate:** Der Account bei 21st.dev und der Key werden vom Owner angelegt. Es wird nur der Free-/Hobby-Tier genutzt, ein Upgrade gibt es nur mit Freigabe.
- 21st liefert **React + shadcn/ui + Tailwind**. Für diese Seite dient das nur als Vorlage. Jede Komponente wird in statisches HTML/CSS übersetzt, mit den Taste-Regeln oben. Kein React-Code im Repo.
- Ohne Key nutzen wir 21st.dev im Browser als Inspirations-Bibliothek, das kostet nichts.
