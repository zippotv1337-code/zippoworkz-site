/* Homepage tools: offer finder and AI security self-check. Runs only in the browser, nothing is sent or stored. */
(function () {
  "use strict";
  var OFFERS = {
    ablauf: { title: "Anfrage-Autopilot", text: "Anfragen werden eingeordnet, landen im CRM und bekommen einen Antwortentwurf zur Freigabe. Festpreis 1.490 €, in der Regel in sieben Arbeitstagen live.", demo: "demo", demoLabel: "Kundencenter ansehen" },
    app: { title: "KI-gebaute App reparieren und absichern", text: "Wir finden, warum deine Lovable- oder Bolt-App live nicht läuft, schließen Datenlecks und bringen sie sicher online.", demo: "app-demo/", demoLabel: "Datenleck-Demo ansehen" },
    lokal: { title: "Lokale KI auf deinem Rechner", text: "Ein KI-Assistent auf deinem eigenen PC, mit Fragen an deine Dokumente, ohne Cloud. Vorher prüfen wir deine Hardware.", demo: "", demoLabel: "" },
    geo: { title: "Von ChatGPT gefunden werden", text: "Wir prüfen, ob ChatGPT, Perplexity, Claude und Gemini deine Firma nennen, und beheben, was fehlt.", demo: "geo-demo/", demoLabel: "Beispielbericht ansehen" },
    sicher: { title: "Sicherheitscheck für KI-Agenten", text: "Wir testen dein Setup gegen Prompt-Injection, prüfen Rechte und Schlüssel und bauen Freigaben ein.", demo: "agent-demo/", demoLabel: "Prompt-Injection-Demo ansehen" }
  };
  var TIPS = [
    "Senden, Zahlen und Löschen nur nach Freigabe durch einen Menschen.",
    "Schlüssel gehören in einen Tresor oder in Umgebungsvariablen, nie in Code, Workflows oder Chats.",
    "Text aus Mails, Webseiten und Formularen ist für die KI Inhalt, nie ein Befehl. Verdächtige Stellen markieren.",
    "Jedem Agenten und MCP-Server nur die Rechte geben, die er wirklich braucht.",
    "Chatbots müssen sich als KI zu erkennen geben (EU AI Act, Art. 50).",
    "Protokollieren, was die KI wann getan hat, damit Fehler nachvollziehbar sind."
  ];

  function rate(checked) {
    var n = checked.length;
    return { n: n, level: n === 0 ? "ok" : n <= 2 ? "mid" : "bad",
             label: n === 0 ? "Gut aufgestellt" : n <= 2 ? "Ein paar Lücken" : "Hohes Risiko",
             tips: checked.map(function (i) { return TIPS[i]; }) };
  }
  if (typeof module !== "undefined") { module.exports = { rate: rate, OFFERS: OFFERS }; return; }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function link(href, text, cls) { var a = el("a", cls || "link go", text); a.href = href; return a; }

  var finder = document.getElementById("finder");
  if (finder) {
    var out = document.getElementById("finder-out");
    finder.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-offer]");
      if (!b) return;
      finder.querySelectorAll("button[data-offer]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var key = b.dataset.offer, o = OFFERS[key];
      out.replaceChildren(el("h3", null, o.title), el("p", null, o.text));
      var row = el("p", "tool-actions");
      row.append(link("kontakt?thema=" + (key === "sicher" ? "app" : key), "Anfrage stellen", "btn"));
      if (o.demo) row.append(link(o.demo, o.demoLabel));
      out.append(row);
      out.hidden = false;
    });
  }

  var check = document.getElementById("selfcheck");
  if (check) {
    var res = document.getElementById("selfcheck-out");
    var update = function () {
      var checked = [];
      check.querySelectorAll("input[type=checkbox]").forEach(function (c, i) { if (c.checked) checked.push(i); });
      var r = rate(checked);
      res.className = "selfcheck-out " + r.level;
      var head = el("p", "light"); head.append(el("b", null, r.label), document.createTextNode(" · " + r.n + " von 6 Risiken"));
      res.replaceChildren(head);
      if (r.tips.length) {
        var ul = el("ul"); r.tips.forEach(function (t) { ul.append(el("li", null, t)); }); res.append(ul);
        var row = el("p", "tool-actions"); row.append(link("kontakt?thema=app", "Sicherheitscheck anfragen", "btn"), link("agent-demo/", "So sieht ein Angriff aus")); res.append(row);
      } else {
        res.append(el("p", null, "Keine der typischen Lücken angekreuzt. Ein externer Test lohnt sich trotzdem, bevor die KI mehr Rechte bekommt."));
      }
    };
    check.addEventListener("change", update);
    update();
  }
})();
