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
