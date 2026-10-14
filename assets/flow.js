// Zippoworkz Leitstelle: animierter Ablauf und Live-Demo.
// Alles läuft im Browser. Es wird nichts gesendet und nichts gespeichert.
(function () {
  "use strict";
  var board = document.getElementById("board");
  if (!board) return;

  var SVG = "http://www.w3.org/2000/svg";
  var lanes = board.querySelector(".lanes");
  var wires = board.querySelector(".wires");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EDGES = [
    ["mail", "sort"], ["form", "sort"], ["dm", "sort"],
    ["sort", "crm"], ["sort", "team"], ["sort", "draft"],
    ["crm", "gate"], ["team", "gate"], ["draft", "gate"]
  ];
  var nodes = {};
  board.querySelectorAll("[data-node]").forEach(function (el) {
    nodes[el.getAttribute("data-node")] = { el: el, small: el.querySelector("small"), rest: el.querySelector("small").textContent };
  });
  var paths = {};
  var running = false;
  var visible = false;

  // ---------- wiring ----------
  function layout() {
    var box = lanes.getBoundingClientRect();
    wires.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
    wires.setAttribute("width", box.width);
    wires.setAttribute("height", box.height);
    EDGES.forEach(function (edge) {
      var a = nodes[edge[0]].el.getBoundingClientRect();
      var b = nodes[edge[1]].el.getBoundingClientRect();
      var d;
      if (b.left >= a.right - 4) {
        var x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
        var x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
        var mx = (x1 + x2) / 2;
        d = "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2;
      } else {
        var sx = a.left + a.width / 2 - box.left, sy = a.bottom - box.top;
        var ex = b.left + b.width / 2 - box.left, ey = b.top - box.top;
        var my = (sy + ey) / 2;
        d = "M" + sx + " " + sy + " C" + sx + " " + my + " " + ex + " " + my + " " + ex + " " + ey;
      }
      var key = edge[0] + ">" + edge[1];
      var path = paths[key];
      if (!path) {
        path = document.createElementNS(SVG, "path");
        wires.appendChild(path);
        paths[key] = path;
      }
      path.setAttribute("d", d);
    });
  }

  // ---------- packets ----------
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function travel(from, to, opts) {
    var path = paths[from + ">" + to];
    return new Promise(function (done) {
      if (!path) { done(); return; }
      if (reduced) { setTimeout(done, opts.ghost ? 0 : 140); return; }
      var dot = document.createElementNS(SVG, "circle");
      dot.setAttribute("r", opts.ghost ? 3 : 5);
      if (opts.ghost) dot.setAttribute("class", "ghost");
      wires.appendChild(dot);
      if (!opts.ghost) path.classList.add("hot");
      var length = path.getTotalLength();
      var start = null;
      var duration = opts.duration || 700;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var p = path.getPointAtLength(ease(t) * length);
        dot.setAttribute("transform", "translate(" + p.x + " " + p.y + ")");
        if (t < 1) { requestAnimationFrame(frame); return; }
        dot.remove();
        if (!opts.ghost) setTimeout(function () { path.classList.remove("hot"); }, 400);
        done();
      }
      requestAnimationFrame(frame);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 120) : ms); }); }

  // Ambient traffic while the board is on screen and idle.
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function ambient() {
    if (reduced || running || !visible || document.hidden) { setTimeout(ambient, 1200); return; }
    var input = pick(["mail", "form", "dm"]);
    var action = pick(["crm", "team", "draft"]);
    var g = { ghost: true, duration: 1100 };
    travel(input, "sort", g)
      .then(function () { return travel("sort", action, g); })
      .then(function () { return travel(action, "gate", g); })
      .then(function () { setTimeout(ambient, 500); });
  }

  // ---------- demo logic ----------
  var RULES = {
    spam: ["gewinn", "gewonnen", "krypto", "crypto", "bitcoin", "backlink", "seo-ranking", "platz 1 bei google", "casino", "klick hier", "garantiert", "guest post"],
    support: ["funktioniert nicht", "fehler", "geht nicht", "problem", "rechnung", "stornier", "kündig", "zugang", "passwort", "hilfe", "support", "bestellung", "defekt"],
    lead: ["angebot", "preis", "kosten", "anfrage", "projekt", "automatis", "zusammenarbeit", "termin", "beratung", "interesse", "budget", "workflow", "crm", "hubspot", "agentur"]
  };
  var LABEL = { lead: "Lead", support: "Support", spam: "Spam", unklar: "Unklar" };

  function classify(text) {
    var s = text.toLowerCase();
    var best = "unklar", hits = [];
    ["spam", "support", "lead"].forEach(function (type) {
      var found = RULES[type].filter(function (w) { return s.indexOf(w) !== -1; });
      if (found.length > hits.length) { best = type; hits = found; }
    });
    var name = null;
    var m = text.match(/(?:grüße|gruß|lg|vg|beste grüße|danke)[,!.]?\s*\n+\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+(?:\s[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)?)/i) ||
            text.match(/\n\s*(?:lg|vg)\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+(?:\s[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)?)/i) ||
            text.match(/ich bin ([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+(?:\s[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+)?)/);
    if (m) name = m[1].trim();
    if (!name) {
      var last = text.trim().split(/\n/).pop().trim();
      if (/^[A-ZÄÖÜ][a-zäöüß]+(\s[A-ZÄÖÜ][a-zäöüß-]+)?$/.test(last)) name = last;
    }
    var mail = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [null])[0];
    return { type: best, hits: hits.slice(0, 2), name: name, mail: mail };
  }

  function draftFor(r) {
    var first = r.name ? r.name.split(" ")[0] : "";
    var hello = first ? "Hallo " + first + "," : "Hallo,";
    if (r.type === "lead") {
      return hello + "\n\ndanke für deine Anfrage. Damit ich das gut einschätzen kann: Welche Tools nutzt ihr heute, und wie oft fällt der Ablauf pro Woche an?\n\nViele Grüße\nPhilipp";
    }
    if (r.type === "support") {
      return hello + "\n\ndanke für die Nachricht. Wir schauen uns das an und melden uns mit einer Lösung.\n\nViele Grüße";
    }
    return "";
  }

  var logEl = document.getElementById("log");
  var logEmpty = document.getElementById("log-empty");
  var draftBox = document.getElementById("draft");
  var draftText = document.getElementById("draft-text");
  var gateActions = document.getElementById("gate-actions");
  var runBtn = document.getElementById("run");
  var textarea = document.getElementById("msg");
  var channel = document.getElementById("channel");
  var t0 = 0;

  function log(text, kind) {
    logEmpty.hidden = true;
    var li = document.createElement("li");
    if (kind) li.className = kind;
    var time = document.createElement("time");
    var secs = ((performance.now() - t0) / 1000).toFixed(1);
    time.textContent = "+" + secs + " s";
    var span = document.createElement("span");
    span.textContent = text;
    li.appendChild(time); li.appendChild(span);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function setNode(key, state, text) {
    var n = nodes[key];
    n.el.classList.remove("on", "ok", "waiting", "off");
    if (state) n.el.classList.add(state);
    n.small.textContent = text == null ? n.rest : text;
  }
  function resetAll() {
    Object.keys(nodes).forEach(function (k) { setNode(k, null, null); });
    logEl.innerHTML = "";
    logEmpty.hidden = false;
    draftBox.hidden = true;
    gateActions.hidden = true;
  }

  var pendingGate = null;

  function run() {
    if (running) return;
    var text = textarea.value.trim();
    if (!text) { textarea.focus(); textarea.setAttribute("aria-invalid", "true"); return; }
    textarea.removeAttribute("aria-invalid");
    running = true;
    runBtn.disabled = true;
    resetAll();
    t0 = performance.now();
    var input = channel.value;
    var inputName = channel.options[channel.selectedIndex].text;
    var r = classify(text);
    var who = r.name || r.mail || "unbekannt";

    setNode(input, "on", "Neue Nachricht");
    log("Eingang über " + inputName + " von " + who);
    wait(250)
      .then(function () { setNode(input, "ok", "Übernommen"); return travel(input, "sort", { duration: 650 }); })
      .then(function () {
        setNode("sort", "on", "Lese die Nachricht …");
        return wait(550);
      })
      .then(function () {
        var why = r.hits.length ? " (erkannt an „" + r.hits.join("“, „") + "“)" : " (keine klaren Merkmale)";
        setNode("sort", "ok", LABEL[r.type]);
        log("Eingeordnet als " + LABEL[r.type] + why);
        var targets = { lead: ["crm", "team", "draft"], support: ["team", "draft"], spam: [], unklar: ["team"] }[r.type];
        ["crm", "team", "draft"].forEach(function (k) { if (targets.indexOf(k) === -1) setNode(k, "off", null); });
        if (!targets.length) {
          log("Als Spam archiviert. Keine Aktion, kein Aufwand für dich.", "ok");
          setNode("gate", "off", "Nicht nötig");
          return null;
        }
        return Promise.all(targets.map(function (k) {
          return travel("sort", k, { duration: 650 }).then(function () {
            if (k === "crm") { setNode("crm", "ok", "Kontakt + Deal „Neue Anfrage“"); log("CRM: Kontakt " + who + " angelegt, Deal in Phase „Neu“", "ok"); }
            if (k === "team") {
              var ch = r.type === "lead" ? "#vertrieb" : r.type === "support" ? "#support" : "#posteingang";
              setNode("team", "ok", "Gemeldet in " + ch);
              log("Slack " + ch + ": " + (r.type === "unklar" ? "Bitte von Hand ansehen" : LABEL[r.type] + " von " + who), "ok");
            }
            if (k === "draft") { setNode("draft", "ok", "Entwurf liegt bereit"); log("Antwortentwurf erstellt", "ok"); }
          });
        })).then(function () { return targets; });
      })
      .then(function (targets) {
        if (!targets) return;
        if (targets.indexOf("draft") === -1) {
          log("Unklare Nachricht: Ein Mensch entscheidet, der Bot antwortet nicht.", "wait");
          setNode("gate", "waiting", "Bitte selbst ansehen");
          return;
        }
        return travel("draft", "gate", { duration: 650 }).then(function () {
          draftText.textContent = draftFor(r);
          draftBox.hidden = false;
          setNode("gate", "waiting", "Wartet auf deine Freigabe");
          gateActions.hidden = false;
          log("Wartet auf deine Freigabe", "wait");
          pendingGate = true;
          document.getElementById("approve").focus({ preventScroll: true });
        });
      })
      .then(function () {
        running = false;
        runBtn.disabled = false;
      });
  }

  function decide(ok) {
    if (!pendingGate) return;
    pendingGate = null;
    gateActions.hidden = true;
    if (ok) {
      setNode("gate", "ok", "Freigegeben und gesendet");
      log("Freigegeben. Antwort gesendet (Demo, nichts verlässt deinen Browser).", "ok");
    } else {
      setNode("gate", null, "Verworfen, nichts gesendet");
      log("Verworfen. Der Entwurf wurde nicht gesendet.");
    }
    runBtn.focus({ preventScroll: true });
  }

  // ---------- samples ----------
  var SAMPLES = {
    lead: "Hallo, wir sind eine kleine Recruiting-Agentur und tragen jede Bewerbung von Hand ins CRM ein. Was würde es kosten, das zu automatisieren?\n\nViele Grüße\nJana Köhler",
    support: "Hi, der Rechnungslink aus eurer letzten Mail funktioniert nicht. Könnt ihr helfen?\n\nLG Murat Demir",
    spam: "Glückwunsch, Sie haben gewonnen! Klick hier für garantierte Backlinks und Platz 1 bei Google.",
    unklar: "Hey, kurze Frage zu letzter Woche. Hast du kurz Zeit?\nTom"
  };
  var CHANNEL = { lead: "form", support: "mail", spam: "mail", unklar: "dm" };
  var sampleBtns = Array.prototype.slice.call(board.querySelectorAll("[data-sample]"));
  sampleBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-sample");
      textarea.value = SAMPLES[key];
      channel.value = CHANNEL[key];
      sampleBtns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    });
  });
  textarea.addEventListener("input", function () {
    sampleBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    textarea.removeAttribute("aria-invalid");
  });

  runBtn.addEventListener("click", run);
  document.getElementById("approve").addEventListener("click", function () { decide(true); });
  document.getElementById("reject").addEventListener("click", function () { decide(false); });

  // ---------- start ----------
  layout();
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(lanes);
  else window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.2 }).observe(board);
  } else { visible = true; }
  setTimeout(ambient, 600);
})();
