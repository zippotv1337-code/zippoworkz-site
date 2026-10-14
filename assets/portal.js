// ZippoWorkz Kundencenter (Demo). Beispieldaten, alles nur im Browser.
// Nichts wird gesendet oder gespeichert; ein Neuladen setzt die Demo zurück.
(function () {
  "use strict";
  var app = document.getElementById("portal");
  if (!app) return;

  // ---------- sample data ----------
  var state = {
    tickets: [
      { id: "ZW-1047", title: "Neue Kategorie „Initiativbewerbung“ ergänzen", kind: "Änderungswunsch", prio: "Normal", status: "In Bearbeitung", updated: "heute, 09:12",
        thread: [
          { from: "Du", text: "Wir bekommen immer mehr Initiativbewerbungen per Mail. Könnt ihr dafür eine eigene Kategorie anlegen, die direkt an Sara geht?" },
          { from: "ZippoWorkz", text: "Machen wir. Wir legen die Kategorie an, trainieren die Einordnung mit euren letzten 15 Beispielen und schicken dir einen Testlauf zur Freigabe." }
        ] },
      { id: "ZW-1044", title: "Antwortentwurf nennt alten Ansprechpartner", kind: "Fehler", prio: "Hoch", status: "Erledigt", updated: "gestern",
        thread: [
          { from: "Du", text: "In den Entwürfen steht noch Tom als Ansprechpartner, der ist seit Montag nicht mehr da." },
          { from: "ZippoWorkz", text: "Vorlage angepasst und mit 10 Testanfragen geprüft. Alle neuen Entwürfe nennen jetzt Sara. Ticket geschlossen, melde dich, falls dir noch etwas auffällt." }
        ] },
      { id: "ZW-1039", title: "Wochenbericht auch an die Geschäftsführung", kind: "Änderungswunsch", prio: "Niedrig", status: "Erledigt", updated: "vor 5 Tagen",
        thread: [
          { from: "Du", text: "Kann der Wochenbericht montags zusätzlich an Jens gehen?" },
          { from: "ZippoWorkz", text: "Ist eingerichtet. Ab nächstem Montag bekommt Jens den Bericht mit." }
        ] }
    ],
    approvals: [
      { id: 1, kind: "Antwortentwurf", to: "Lena Hartmann", subject: "Re: Anfrage Personalberatung Vertrieb", body: "Hallo Frau Hartmann,\n\nvielen Dank für Ihre Anfrage. Gern stellen wir Ihnen unser Vorgehen in einem kurzen Gespräch vor. Passt Ihnen Donnerstag oder Freitag am Vormittag?\n\nViele Grüße\nSara Winter" },
      { id: 2, kind: "Antwortentwurf", to: "Daniel Roth", subject: "Re: Rückfrage zum Angebot", body: "Hallo Herr Roth,\n\ndanke für die Rückfrage. Das Angebot gilt bis Ende des Monats, die Konditionen bleiben wie besprochen.\n\nViele Grüße\nSara Winter" },
      { id: 3, kind: "Löschung", to: "Kontakt im CRM", subject: "Löschanfrage nach DSGVO: M. Becker", body: "Der Kontakt hat per Mail die Löschung seiner Daten verlangt. Nach deiner Freigabe wird der Datensatz im CRM gelöscht und die Löschung im Protokoll vermerkt." }
    ],
    automations: [
      { id: "anfragen", name: "Anfrage-Autopilot", desc: "Postfach und Kontaktformular einordnen, CRM-Eintrag, Antwortentwurf zur Freigabe", on: true, last: "vor 4 Min.", today: 23, errors: 0 },
      { id: "crm", name: "CRM-Pflege", desc: "Status, Aufgaben und Erinnerungen aus Mails und Terminen aktualisieren", on: true, last: "vor 11 Min.", today: 41, errors: 1 },
      { id: "bericht", name: "Wochenbericht", desc: "Jeden Montag um 7:00 an Team und Geschäftsführung", on: true, last: "Montag, 07:00", today: 0, errors: 0 }
    ],
    nextId: 1048
  };

  // ---------- helpers ----------
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function badge(text, kind) { return el("span", { class: "pill pill-" + kind, text: text }); }
  function statusKind(s) { return { "Neu": "new", "In Bearbeitung": "work", "Wartet auf dich": "wait", "Erledigt": "done" }[s] || "new"; }
  var toastTimer;
  function toast(text) {
    var t = document.getElementById("toast");
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- navigation ----------
  var views = Array.prototype.slice.call(app.querySelectorAll("[data-view]"));
  var links = Array.prototype.slice.call(app.querySelectorAll("[data-go]"));
  function show(name) {
    if (!document.getElementById("view-" + name)) name = "uebersicht";
    views.forEach(function (v) { v.hidden = v.getAttribute("data-view") !== name; });
    links.forEach(function (a) {
      if (a.getAttribute("data-go") === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var h = document.querySelector("#view-" + name + " h2");
    if (h && document.activeElement && document.activeElement.closest && document.activeElement.closest(".portal-nav")) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    render(name);
  }
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var name = a.getAttribute("data-go");
      if (history.replaceState) history.replaceState(null, "", "#" + name);
      show(name);
    });
  });

  // ---------- views ----------
  function counts() {
    document.querySelectorAll("[data-count=approvals]").forEach(function (n) { n.textContent = state.approvals.length; n.hidden = !state.approvals.length; });
    var open = state.tickets.filter(function (t) { return t.status !== "Erledigt"; }).length;
    document.querySelectorAll("[data-count=tickets]").forEach(function (n) { n.textContent = open; n.hidden = !open; });
  }

  function renderOverview() {
    var box = document.getElementById("auto-status");
    box.innerHTML = "";
    state.automations.forEach(function (a) {
      box.appendChild(el("li", null, [
        el("div", null, [el("b", { text: a.name }), el("small", { text: "Letzter Lauf " + a.last })]),
        a.on ? (a.errors ? badge(a.errors + " Hinweis", "wait") : badge("Läuft", "done")) : badge("Pausiert", "off")
      ]));
    });
    document.getElementById("ov-approvals").textContent = state.approvals.length;
    document.getElementById("ov-tickets").textContent = state.tickets.filter(function (t) { return t.status !== "Erledigt"; }).length;
  }

  var currentTicket = null;
  function renderTickets() {
    var list = document.getElementById("ticket-list");
    list.innerHTML = "";
    var filter = document.getElementById("ticket-filter").value;
    state.tickets.filter(function (t) { return filter === "alle" || (filter === "offen" ? t.status !== "Erledigt" : t.status === "Erledigt"); })
      .forEach(function (t) {
        var btn = el("button", { type: "button", class: "ticket-row" + (currentTicket === t.id ? " active" : ""), "aria-pressed": currentTicket === t.id ? "true" : "false", onclick: function () { currentTicket = t.id; renderTickets(); } }, [
          el("span", { class: "tid", text: t.id }),
          el("span", { class: "ttitle", text: t.title }),
          el("span", { class: "tmeta", text: t.kind + " · " + t.updated }),
          badge(t.status, statusKind(t.status))
        ]);
        list.appendChild(el("li", null, [btn]));
      });
    if (!list.children.length) list.appendChild(el("li", { class: "empty", text: "Keine Tickets in dieser Ansicht." }));
    var detail = document.getElementById("ticket-detail");
    var t = state.tickets.filter(function (x) { return x.id === currentTicket; })[0];
    detail.innerHTML = "";
    if (!t) {
      detail.appendChild(el("p", { class: "empty", text: "Wähle links ein Ticket oder lege ein neues an. Antworten kommen in dieser Demo automatisch als Beispiel." }));
      return;
    }
    detail.appendChild(el("div", { class: "detail-head" }, [el("h3", { text: t.title }), badge(t.status, statusKind(t.status))]));
    detail.appendChild(el("p", { class: "detail-meta", text: t.id + " · " + t.kind + " · Priorität " + t.prio }));
    var thread = el("ol", { class: "thread" });
    t.thread.forEach(function (m) {
      thread.appendChild(el("li", { class: m.from === "Du" ? "me" : "us" }, [el("b", { text: m.from === "Du" ? "Du" : "ZippoWorkz" }), el("p", { text: m.text })]));
    });
    detail.appendChild(thread);
    if (t.status !== "Erledigt") {
      var ta = el("textarea", { id: "reply-text", rows: "3", "aria-label": "Antwort auf " + t.id, placeholder: "Antwort schreiben" });
      detail.appendChild(el("div", { class: "reply" }, [ta, el("button", { type: "button", class: "btn", onclick: function () {
        var v = ta.value.trim(); if (!v) { ta.focus(); return; }
        t.thread.push({ from: "Du", text: v }); t.updated = "gerade eben"; renderTickets(); toast("Antwort hinzugefügt (Demo)");
      } }, ["Antworten"])]));
    }
  }

  function createTicket(e) {
    e.preventDefault();
    var f = e.target;
    var title = f.querySelector("#t-title").value.trim();
    var desc = f.querySelector("#t-desc").value.trim();
    var err = f.querySelector("#t-error");
    if (!title || !desc) { err.hidden = false; (title ? f.querySelector("#t-desc") : f.querySelector("#t-title")).focus(); return; }
    err.hidden = true;
    var t = { id: "ZW-" + (state.nextId++), title: title, kind: f.querySelector("#t-kind").value, prio: f.querySelector("#t-prio").value, status: "Neu", updated: "gerade eben", thread: [{ from: "Du", text: desc }] };
    state.tickets.unshift(t);
    currentTicket = t.id;
    f.reset();
    document.getElementById("ticket-filter").value = "offen";
    renderTickets(); counts();
    toast(t.id + " angelegt");
    setTimeout(function () {
      t.status = "In Bearbeitung"; t.updated = "gerade eben";
      t.thread.push({ from: "ZippoWorkz", text: "Danke, ist angekommen. Wir schauen es uns an und melden uns mit dem nächsten Schritt. (Beispielantwort der Demo)" });
      if (!document.getElementById("view-tickets").hidden) renderTickets();
      counts();
    }, 2200);
  }

  function renderApprovals() {
    var list = document.getElementById("approval-list");
    list.innerHTML = "";
    if (!state.approvals.length) {
      list.appendChild(el("li", { class: "empty", text: "Alles freigegeben. Neue Entwürfe erscheinen hier, sobald sie anstehen." }));
      return;
    }
    state.approvals.forEach(function (a) {
      list.appendChild(el("li", { class: "approval" }, [
        el("div", { class: "approval-head" }, [badge(a.kind, a.kind === "Löschung" ? "wait" : "new"), el("b", { text: a.subject }), el("small", { text: "An: " + a.to })]),
        el("p", { class: "approval-body", text: a.body }),
        el("div", { class: "approval-actions" }, [
          el("button", { type: "button", class: "btn", onclick: function () { decide(a, true); } }, ["Freigeben"]),
          el("button", { type: "button", class: "btn ghost", onclick: function () { decide(a, false); } }, ["Zurückhalten"])
        ])
      ]));
    });
  }
  function decide(a, ok) {
    state.approvals = state.approvals.filter(function (x) { return x !== a; });
    renderApprovals(); counts(); renderOverview();
    toast(ok ? (a.kind === "Löschung" ? "Löschung freigegeben (Demo)" : "Freigegeben, wird gesendet (Demo)") : "Zurückgehalten, nichts gesendet");
  }

  function renderAutomations() {
    var list = document.getElementById("automation-list");
    list.innerHTML = "";
    state.automations.forEach(function (a) {
      var sw = el("button", { type: "button", role: "switch", class: "switch", "aria-checked": a.on ? "true" : "false", "aria-label": a.name + (a.on ? " pausieren" : " fortsetzen"), onclick: function () {
        a.on = !a.on; renderAutomations(); renderOverview(); toast(a.name + (a.on ? " läuft wieder" : " pausiert"));
      } }, [el("span")]);
      list.appendChild(el("li", { class: "automation" }, [
        el("div", null, [el("h3", { text: a.name }), el("p", { text: a.desc }),
          el("p", { class: "auto-meta", text: "Letzter Lauf " + a.last + " · heute " + a.today + " Durchläufe · " + (a.errors ? a.errors + " Hinweis" : "keine Fehler") })]),
        el("div", { class: "auto-actions" }, [sw, a.id === "anfragen" ? el("a", { href: "#testlauf", class: "link", onclick: function (e) { e.preventDefault(); history.replaceState && history.replaceState(null, "", "#testlauf"); show("testlauf"); } }, ["Testlauf"]) : null])
      ]));
    });
  }


  // ---------- Szenarien + Live-Verlauf ----------
  // Beispielwerte im Zeitraffer (1 Demo-Sekunde = 5 Minuten); keine verbindliche Zusage.
  var scenarios = [
    { id: "bewerbung", name: "Bewerbungseingang", desc: "Bewerbungen aus Mail und Formular landen sortiert im CRM, Antwortentwurf wartet auf Freigabe.", sample: "Bewerbungen kommen per Mail und Formular, wir tragen alles von Hand ins CRM ein." },
    { id: "anfragen", name: "Kundenanfragen beantworten", desc: "Anfragen werden eingeordnet, dringende gehen sofort ans Team, der Rest bekommt einen Entwurf.", sample: "Anfragen über Instagram und Mail gehen unter, niemand sieht rechtzeitig, was dringend ist." },
    { id: "bericht", name: "Wochenbericht automatisch", desc: "Zahlen aus CRM und Postfach werden montags zu einem Bericht für Team und Chef.", sample: "Jeden Montag bauen wir den Wochenbericht aus drei Tabellen zusammen." }
  ];
  var picked = null, liveTimer;
  var steps = [
    { at: 0, text: "Ticket ist bei uns eingegangen", mail: null },
    { at: 2, text: "Bestätigung per E-Mail an dich", mail: "Neue E-Mail: „Dein Ticket ist angekommen“" },
    { at: 30, text: "Erste Antwort mit Rückfragen zu Tools und Zugängen", mail: "Neue E-Mail: „Zwei kurze Rückfragen zu deinem Ablauf“" },
    { at: 240, text: "Konkreter Vorschlag mit Umfang und Testplan", mail: "Neue E-Mail: „Vorschlag und nächster Schritt“" }
  ];
  function fmt(min) { return min < 60 ? min + " Min." : (Math.round(min / 6) / 10).toString().replace(".", ",") + " Std."; }
  function renderScenarios() {
    var box = document.getElementById("scenario-list");
    if (box.children.length) return;
    scenarios.forEach(function (s) {
      box.appendChild(el("button", { type: "button", class: "scenario", "aria-pressed": "false", onclick: function () {
        picked = s;
        Array.prototype.forEach.call(box.children, function (b) { b.setAttribute("aria-pressed", b === this ? "true" : "false"); }, this);
        document.getElementById("sc-title").textContent = s.name;
        var ta = document.getElementById("sc-text"); if (!ta.value.trim()) ta.value = s.sample; ta.focus();
      } }, [el("b", { text: s.name }), el("span", { text: s.desc })]));
    });
  }
  function startLive(e) {
    e.preventDefault();
    var txt = document.getElementById("sc-text").value.trim(), err = document.getElementById("sc-error");
    if (!picked || !txt) { err.hidden = false; return; }
    err.hidden = true;
    var t = { id: "ZW-" + (state.nextId++), title: picked.name + ": " + txt.slice(0, 60), kind: "Änderungswunsch", prio: "Normal", status: "Neu", updated: "gerade eben", thread: [{ from: "Du", text: txt }] };
    state.tickets.unshift(t); counts();
    var live = document.getElementById("live"), list = document.getElementById("live-steps"), clock = document.getElementById("live-clock");
    document.getElementById("live-title").textContent = t.id + " · Live-Verlauf";
    live.hidden = false; list.innerHTML = ""; clearTimeout(liveTimer);
    steps.forEach(function (s) { list.appendChild(el("li", { class: "pending" }, [el("time", { text: "nach ca. " + fmt(s.at) }), el("span", { text: s.text })])); });
    // Stetiger Zeitraffer: 0 bis 240 Min. in 12 s. setTimeout statt rAF, damit es auch im Hintergrund-Tab weiterläuft.
    var total = 240, dur = 12000, t0 = performance.now(), shown = 0;
    clearTimeout(liveTimer); live.style.setProperty("--p", 0);
    (function tick(now) {
      var min = Math.min(total, Math.round((now - t0) / dur * total));
      clock.textContent = "ca. " + fmt(min);
      live.style.setProperty("--p", min / total);
      while (shown < steps.length && steps[shown].at <= min) {
        var s = steps[shown];
        list.children[shown].className = "done";
        if (shown === 1) { t.status = "In Bearbeitung"; t.thread.push({ from: "ZippoWorkz", text: "Danke, ist angekommen. Wir melden uns mit Rückfragen. (Beispielantwort der Demo)" }); counts(); }
        if (s.mail) toast(s.mail);
        shown++;
      }
      if (min < total) liveTimer = setTimeout(function () { tick(performance.now()); }, 33);
    })(t0);
  }

  var rendered = {};
  function render(name) {
    counts();
    if (name === "uebersicht") renderOverview();
    if (name === "tickets") renderTickets();
    if (name === "freigaben") renderApprovals();
    if (name === "automationen") renderAutomations();
    if (name === "szenarien") renderScenarios();
    rendered[name] = true;
  }

  document.getElementById("ticket-form").addEventListener("submit", createTicket);
  document.getElementById("scenario-form").addEventListener("submit", startLive);
  document.getElementById("ticket-filter").addEventListener("change", renderTickets);
  document.querySelectorAll("[data-doc]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-doc");
      document.querySelectorAll(".doc").forEach(function (d) { d.hidden = d.id !== id; });
      document.querySelectorAll("[data-doc]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    });
  });

  // ---------- entry ----------
  var gate = document.getElementById("portal-gate");
  var shell = document.getElementById("portal-shell");
  document.getElementById("enter").addEventListener("click", function () {
    gate.hidden = true; shell.hidden = false;
    var start = location.hash.slice(1) || "uebersicht";
    show(start);
    document.getElementById("portal-title").focus({ preventScroll: true });
    window.dispatchEvent(new Event("resize"));
  });
  var deep = location.hash.slice(1);
  if (deep && document.getElementById("view-" + deep)) { gate.hidden = true; shell.hidden = false; show(deep); }
})();
