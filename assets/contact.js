/* Contact form. Sends plain text only (no files) to a form service that mails info@zippoworkz.com.
   OWNER-GATE: endpoint stays empty until the owner picks a service; the CSP in kontakt.html must allow it too. */
(function () {
  "use strict";
  var ENDPOINT = "https://api.web3forms.com/submit";
  var ACCESS_KEY = "0b486529-d69b-458c-93a6-02753bf86cae"; // public Web3Forms form key (designed to sit in the page), not a secret

  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var LABELS = { ablauf: "Was passiert heute von Hand? *", app: "Was funktioniert an deiner App nicht? *",
                 lokal: "Wofür soll die lokale KI da sein, und welcher Rechner ist da? *", geo: "Wie heißt deine Firma, wo bist du tätig, und welche Fragen stellen deine Kunden? *", anderes: "Worum geht es genau? *" };

  // Preselect the topic from links like kontakt?thema=app
  var preset = new URLSearchParams(location.search).get("thema");
  var radio = preset && form.querySelector('input[name="topic"][value="' + preset.replace(/[^a-z]/g, "") + '"]');
  if (radio) radio.checked = true;
  function relabel() {
    var t = form.querySelector('input[name="topic"]:checked');
    if (t) document.getElementById("q-what").textContent = LABELS[t.value];
  }
  form.addEventListener("change", relabel);
  relabel();

  function say(text, ok) { status.textContent = text; status.className = "form-status " + (ok ? "ok" : "bad"); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (d.get("website")) return; // spam trap filled: drop silently
    var missing = [];
    ["name", "email", "what"].forEach(function (k) { if (!String(d.get(k) || "").trim()) missing.push(k); });
    if (!d.get("topic")) missing.push("topic");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.get("email") || ""))) missing.push("email");
    if (!d.get("consent")) missing.push("consent");
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    missing.forEach(function (k) { var el = form.querySelector('[name="' + k + '"]'); if (el) el.setAttribute("aria-invalid", "true"); });
    if (missing.length) { say("Bitte die markierten Pflichtfelder ausfüllen.", false); return; }

    if (!ENDPOINT) { say("Das Formular wird gerade eingerichtet. Bitte schreib uns so lange an info@zippoworkz.com.", false); return; }

    var topic = form.querySelector('input[name="topic"]:checked').parentNode.textContent.trim();
    var body = {
      access_key: ACCESS_KEY,
      subject: "Website-Anfrage: " + topic,
      from_name: "zippoworkz.com",
      name: String(d.get("name")).slice(0, 80),
      email: String(d.get("email")).slice(0, 120),
      company: String(d.get("company") || "").slice(0, 120),
      topic: topic,
      message: String(d.get("what")).slice(0, 2000),
      tools: String(d.get("tools") || "").slice(0, 200),
      urgency: String(d.get("urgency") || "")
    };
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    say("Wird gesendet …", true);
    // Multipart form data is a "simple" CORS request; a JSON body triggers a preflight that Web3Forms rejects.
    var fd = new FormData();
    Object.keys(body).forEach(function (k) { fd.append(k, body[k]); });
    fetch(ENDPOINT, { method: "POST", body: fd })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); form.reset(); relabel(); say("Danke! Deine Anfrage ist angekommen. Wir melden uns innerhalb von zwei Werktagen.", true); })
      .catch(function () { say("Das hat nicht geklappt. Bitte schreib uns direkt an info@zippoworkz.com.", false); })
      .then(function () { btn.disabled = false; });
  });
})();
