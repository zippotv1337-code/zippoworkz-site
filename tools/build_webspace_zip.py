"""Baut dist/zippoworkz-webspace.zip: genau das, was in das Webspace-Root (IONOS) gehört.

Nur Standardbibliothek. Vor dem Packen wird geprüft, dass jede lokale Verlinkung (href/src) in den HTML-Dateien im ZIP liegt.
Aufruf: python tools/build_webspace_zip.py [Zielordner]
"""
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOP = {"index.html", "creator.html", "markets-lab.html", "demo.html", "milo.html", "impressum.html", "datenschutz.html",
       "nutzungsbedingungen.html", "widerruf.html", "404.html", "llms.txt", "robots.txt", "sitemap.xml", ".htaccess"}
REF = re.compile(r'(?:href|src)="([^"#?]+)', re.I)


def files():
    missing = [f for f in sorted(TOP) if not (ROOT / f).is_file()]
    if missing:
        sys.exit("Fehlt im Repo: " + ", ".join(missing))
    used = "".join((ROOT / f).read_text(encoding="utf-8") for f in TOP if f.endswith((".html", ".txt", ".xml")))
    used += "".join(p.read_text(encoding="utf-8") for p in (ROOT / "assets").glob("*.[cj]s*"))
    assets = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "assets").rglob("*") if p.is_file())
    # Nur was die Seite wirklich verwendet (Schrift samt Lizenz immer); unbenutzte Bilder bleiben draußen.
    keep = [a for a in assets if a.startswith("assets/fonts/") or Path(a).name in used]
    skipped = [a for a in assets if a not in keep]
    if skipped:
        print("Nicht im ZIP (von keiner Seite verwendet): " + ", ".join(skipped))
    return sorted(TOP) + keep


def broken_links(names):
    have = set(names)
    out = []
    for name in (n for n in names if n.endswith(".html")):
        for ref in REF.findall((ROOT / name).read_text(encoding="utf-8")):
            if re.match(r"(https?:|mailto:|tel:|data:|javascript:)", ref):
                continue
            target = ref.lstrip("/").removeprefix("./") or "index.html"
            if target not in have and target + ".html" not in have:
                out.append(f"{name}: {ref}")
    return out


def main():
    names = files()
    bad = broken_links(names)
    if bad:
        sys.exit("Kaputte Verlinkungen:\n  " + "\n  ".join(bad))
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / "zippoworkz-webspace.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in names:
            z.write(ROOT / name, name)
    print(f"{target}  ({len(names)} Dateien, {target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
