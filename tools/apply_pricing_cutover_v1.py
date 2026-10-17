from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, new: str, label: str) -> str:
    updated, count = re.subn(pattern, new, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly 1 regex match, found {count}")
    return updated


index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")

index = replace_once(index, '"priceRange": "99–1490 EUR"', '"priceRange": "490–2490+ EUR"', "schema priceRange")

old_offers = '''  "makesOffer": [
   {
    "@type": "Offer",
    "name": "Anfrage-Autopilot",
    "price": "1490",
    "priceCurrency": "EUR",
    "description": "Ein Eingangskanal, KI-Einordnung in bis zu fünf Kategorien, Eintrag in ein Zielsystem, Antwortentwurf zur Freigabe, Benachrichtigung, Fehlerpfad. Umsetzung in der Regel in sieben Arbeitstagen."
   },
   {
    "@type": "Offer",
    "name": "AI UGC Starter",
    "price": "99",
    "priceCurrency": "EUR",
    "url": "https://buy.stripe.com/3cI9AN7SmflP1k8c8M08g00"
   },
   {
    "@type": "Offer",
    "name": "Social Media Content Pack",
    "price": "249",
    "priceCurrency": "EUR",
    "url": "https://buy.stripe.com/6oUcMZdcGa1v9QE0q408g02"
   }
  ]'''
new_offers = '''  "makesOffer": [
   {
    "@type": "Offer",
    "name": "Anfrage-Autopilot",
    "price": "1490",
    "priceCurrency": "EUR",
    "description": "Ein Eingangskanal, KI-Einordnung in bis zu fünf Kategorien, Eintrag in ein Zielsystem, Antwortentwurf zur Freigabe, Benachrichtigung, Fehlerpfad. Umsetzung in der Regel in sieben Arbeitstagen."
   },
   {
    "@type": "AggregateOffer",
    "name": "Individuelle Automation",
    "lowPrice": "2490",
    "priceCurrency": "EUR",
    "description": "Individuelle Automationen ab 2.490 € nach kostenlosem Ablauf-Check und abgestimmtem Scope."
   },
   {
    "@type": "AggregateOffer",
    "name": "Betreuung",
    "lowPrice": "490",
    "priceCurrency": "EUR",
    "description": "Betreuung ab 490 € pro Monat nach abgestimmtem Scope."
   }
  ]'''
index = replace_once(index, old_offers, new_offers, "schema offers")

index = replace_once(
    index,
    '''      <a href="./#leistungen">Leistungen</a>\n      <a href="./#autopilot">Anfrage-Autopilot</a>\n      <a href="./#betreuung">Betreuung</a>\n      <a href="./#creator-os">Creator OS</a>\n      <a href="./#labs">Labs</a>\n      <a href="./#fragen">Fragen</a>''',
    '''      <a href="./#leistungen">Leistungen</a>\n      <a href="./#autopilot">Anfrage-Autopilot</a>\n      <a href="./#ablauf">Ablauf</a>\n      <a href="./#betreuung">Betreuung</a>\n      <a href="./#fragen">Fragen</a>''',
    "main navigation",
)

index = replace_once(
    index,
    '''          <h1 id="hero-title"><span class="wordmark"><span>Zippo</span>Workz</span><span class="tagline">KI-Workflows &amp; Creator OS</span></h1>\n          <p class="lede">Wir bauen KI-Workflows, die im Betrieb laufen, nicht nur in der Präsentation. <strong>Für Agenturen, Recruiting und Dienstleister.</strong></p>''',
    '''          <p class="kicker">KI-Workflows für Agenturen, Recruiting &amp; Dienstleister</p>\n          <h1 id="hero-title" class="slide-title">Anfragen automatisch einordnen.<br>Antwortentwurf bereit, bevor du den Posteingang öffnest.</h1>\n          <p class="lede">Wir bauen den einen Ablauf, der dich jede Woche Zeit kostet – getestet, dokumentiert und mit Freigabe, bevor etwas rausgeht. <strong>In der Regel in 7 Arbeitstagen live.</strong></p>''',
    "hero copy",
)

index = replace_once(
    index,
    '<h2 id="leistungen-title">Zwei Dinge, die wir richtig gut können</h2>\n      <p>Beides läuft bei uns selbst im Betrieb, bevor wir es dir anbieten.</p>',
    '<h2 id="leistungen-title">Ein Ablauf, der im Alltag funktioniert</h2>\n      <p>Wir verbinden Eingang, KI, CRM und Freigabe so, dass ein klarer Prozess zuverlässig läuft.</p>',
    "services heading",
)

index = regex_once(
    index,
    r'\n\s*<article class="pillar reveal" aria-labelledby="p2">.*?</article>',
    '',
    "creator pillar above fold",
)

index = replace_once(
    index,
    'Der Check ist kostenlos. Bezahlt wird erst, wenn der Umfang feststeht. Mehr Kanäle, Systeme oder ein eigener Ablauf: Festpreis nach dem Check, in der Regel ab 3.900 €.',
    'Der Check ist kostenlos. Bezahlt wird erst, wenn der Umfang feststeht. <strong>Individuelle Automation: ab 2.490 €</strong> nach dem Check. Umfang und Festpreis stimmen wir vorher ab.',
    "custom automation price",
)

index = index.replace('Testprotokoll mit zehn echten Beispielanfragen', 'Testprotokoll mit zehn abgestimmten Testfällen')
index = index.replace('Wir setzen um und testen mit zehn echten Beispielen, bevor irgendetwas live geht.', 'Wir setzen um und testen mit zehn abgestimmten Testfällen, bevor irgendetwas live geht.')
index = index.replace('Für deinen Ablauf gibt es mindestens ein Testprotokoll mit zehn echten Beispielen.', 'Für deinen Ablauf gibt es mindestens ein Testprotokoll mit zehn abgestimmten Testfällen.')

new_tiers = '''<div class="tiers reveal" aria-label="Betreuung">
      <article class="tier featured">
        <h3>Betreuung</h3>
        <p class="tier-price"><b>ab 490 €</b><span>pro Monat</span></p>
        <p class="tier-for">Für einen laufenden Ablauf, der zuverlässig weiterlaufen und angepasst werden soll.</p>
        <ul class="ilist">
          <li>Überwachung und Fehlerbehebung im vereinbarten Scope</li>
          <li>Anpassungen bei Updates der angebundenen Tools</li>
          <li>Kundencenter mit Tickets und Freigaben</li>
          <li>Ausbau und Reaktionszeiten werden vor Start passend zum Bedarf vereinbart</li>
        </ul>
      </article>
    </div>
    <p class="tier-note">Größere Betreuungspakete und laufender Ausbau werden nach Ablauf-Check und vereinbartem Scope kalkuliert.</p>'''
index = regex_once(
    index,
    r'<div class="tiers reveal" aria-label="Betreuungspakete">.*?<p class="tier-note">.*?</p>',
    new_tiers,
    "support pricing tiers",
)

index = regex_once(
    index,
    r'<ul class="shop reveal">.*?</ul>',
    '<p class="reveal"><a class="btn" href="creator">Creator Studio ansehen</a></p>',
    "creator shop on homepage",
)

index_path.write_text(index, encoding="utf-8")


guide_path = ROOT / "anfragen-automatisieren.html"
guide = guide_path.read_text(encoding="utf-8")
guide = guide.replace('Größere Abläufe gibt es nach einem kostenlosen Check zum Festpreis, in der Regel ab 3.900 €.', 'Individuelle Automationen gibt es nach einem kostenlosen Check und abgestimmtem Scope ab 2.490 €.')
guide = guide.replace('Mehr Kanäle oder ein eigener Ablauf: Festpreis nach dem Check, in der Regel ab 3.900 €.', 'Mehr Kanäle oder ein eigener Ablauf: Individuelle Automation nach dem Check und abgestimmtem Scope ab 2.490 €.')
if 'ab 3.900 €' in guide:
    raise RuntimeError('guide still contains stale 3.900 price')
guide_path.write_text(guide, encoding="utf-8")


readme_path = ROOT / "README.md"
readme = readme_path.read_text(encoding="utf-8")
readme = regex_once(
    readme,
    r'5\. \*\*Preise.*?(?=\n6\. \*\*Anfrage-Autopilot)',
    '5. **Preise (Owner 17.10.2026):** öffentliche Preisanker sind Anfrage-Autopilot 1.490 €, Individuelle Automation ab 2.490 € und Betreuung ab 490 €/Monat. Kanonische Quelle ist `zippotv1337-code/superhirn:zippoworkz/sales/PRICING_CATALOG_V1.md`; alte 499-/1.900-/3.900-/1.990-Richtwerte sind keine aktuelle Preisquelle. Fiverr/Creator-Preise bleiben separat.\n',
    "README pricing gate",
)
readme_path.write_text(readme, encoding="utf-8")

# One-shot migration helper: remove itself and its trigger after a successful patch.
this_file = Path(__file__)
trigger = ROOT / ".github" / "workflows" / "apply-pricing-cutover.yml"
this_file.unlink()
if trigger.exists():
    trigger.unlink()

print('Pricing V1 patch applied successfully')
