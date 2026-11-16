// KI-Sichtbarkeit demo: a sample report (invented company) and an llms.txt generator that never leaves the browser.
const REPORT = [
  // question, ChatGPT, Perplexity, Claude, Gemini (true = company named). Sample data, not a real measurement.
  ["Guter Maler in Kassel?", false, true, false, false],
  ["Wer streicht eine Wohnung kurzfristig in Kassel?", false, false, false, false],
  ["Fassade streichen lassen Kassel Kosten", false, false, false, false],
  ["Maler mit guten Bewertungen Nordhessen", false, true, false, false],
  ["Tapezieren lassen in Kassel", false, false, false, false],
];

// Plain text only: strips line breaks and markdown control characters so pasted input cannot change the file structure.
function clean(s, max) { return String(s || "").replace(/[\r\n#>\[\]`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function cleanUrl(s) { const u = clean(s, 120); return /^https:\/\/[^\s]+$/i.test(u) ? u : ""; }

function buildLlms(f) {
  const name = clean(f.name, 80) || "Deine Firma";
  const lines = ["# " + name, "", "> " + (clean(f.what, 200) || "Kurze Beschreibung, was ihr macht.") + (clean(f.place, 80) ? " Region: " + clean(f.place, 80) + "." : "")];
  const services = String(f.services || "").split(/\r?\n/).map(s => clean(s, 80)).filter(Boolean).slice(0, 12);
  if (services.length) lines.push("", "## Leistungen", ...services.map(s => "- " + s));
  const url = cleanUrl(f.url), contact = cleanUrl(f.contact);
  if (url || contact) lines.push("", "## Links");
  if (url) lines.push("- Website: " + url);
  if (contact) lines.push("- Kontakt: " + contact);
  return lines.join("\n") + "\n";
}

if (typeof module !== "undefined") {
  module.exports = { buildLlms, clean, REPORT };
} else {
  const tbody = document.querySelector("#report tbody");
  let hits = 0, total = 0;
  REPORT.forEach(([q, ...cells]) => {
    const tr = document.createElement("tr");
    const th = document.createElement("td"); th.textContent = q; tr.append(th);
    cells.forEach(y => { const td = document.createElement("td"); td.className = y ? "y" : "n"; td.textContent = y ? "genannt" : "nein"; tr.append(td); total++; if (y) hits++; });
    tbody.append(tr);
  });
  document.getElementById("score").textContent = hits + " von " + total + " Antworten nennen die Firma";

  const ids = ["name", "place", "what", "services", "url", "contact"];
  const out = document.getElementById("out");
  const render = () => { const f = {}; ids.forEach(k => f[k] = document.getElementById("g-" + k).value); out.textContent = buildLlms(f); };
  ids.forEach(k => document.getElementById("g-" + k).addEventListener("input", render));
  render();
  document.getElementById("copy").addEventListener("click", () => {
    const msg = document.getElementById("copied");
    navigator.clipboard.writeText(out.textContent).then(() => { msg.textContent = "Kopiert. Speichere den Text als llms.txt im Hauptordner deiner Website."; },
      () => { msg.textContent = "Kopieren ging nicht, bitte den Text markieren und kopieren."; });
  });
}
