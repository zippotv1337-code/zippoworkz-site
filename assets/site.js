// Zippoworkz: Ablauf-Notiz im Hero. Ohne JavaScript bleibt die Liste lesbar.
(function () {
  var note = document.getElementById("note");
  if (!note) return;

  var flows = {
    anfragen: {
      status: "Vorher 5 Handgriffe, nachher 1 Freigabe.",
      steps: [
        ["Postfach morgens durchsehen", "Mail, Formular und DM landen an einer Stelle"],
        ["Jede Anfrage lesen und einordnen", "KI sortiert vor: Lead, Support oder Spam"],
        ["Kontakt im CRM von Hand anlegen", "Kontakt und Deal entstehen automatisch"],
        ["Antwort an neue Leads freigeben", "Bleibt bei dir. Du siehst den Entwurf und gibst frei.", true],
        ["Erinnerung für den Follow-up notieren", "Follow-up wird terminiert und gemeldet"]
      ]
    },
    crm: {
      status: "Vorher 5 Handgriffe, nachher 1 Prüfung pro Woche.",
      steps: [
        ["Nach jedem Call Notizen ins CRM tippen", "Gesprächsnotiz wird als Zusammenfassung angehängt"],
        ["Deal-Status von Hand umstellen", "Status folgt Angebot, Antwort und Zahlung"],
        ["Aufgaben für das Team anlegen", "Aufgaben entstehen mit Frist und Zuständigkeit"],
        ["Wöchentlichen Report zusammenkopieren", "Report kommt montags fertig in Slack"],
        ["Report prüfen, bevor er rausgeht", "Bleibt bei dir. Ein Blick, dann geht er an das Team.", true]
      ]
    },
    uebergabe: {
      status: "Vorher 5 Handgriffe, nachher 1 Freigabe.",
      steps: [
        ["Neuen Auftrag per Mail ans Team weiterleiten", "Auftrag erscheint als Projekt mit allen Unterlagen"],
        ["Unterlagen aus drei Ordnern zusammensuchen", "Dateien werden automatisch abgelegt und verlinkt"],
        ["Im Chat nachfragen, wer übernimmt", "Zuständigkeit wird nach Regel vergeben und gemeldet"],
        ["Rechnung freigeben", "Bleibt bei dir. Entwurf ist vorbereitet, du gibst frei.", true],
        ["Kunden über den Stand informieren", "Statusmail geht beim Wechsel der Phase raus"]
      ]
    }
  };

  var list = document.getElementById("steps");
  var status = document.getElementById("note-status");
  var toggle = document.getElementById("note-toggle");
  var tabs = Array.prototype.slice.call(note.querySelectorAll('[role="tab"]'));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render(key) {
    var flow = flows[key];
    list.innerHTML = "";
    flow.steps.forEach(function (step) {
      var li = document.createElement("li");
      if (step[2]) li.className = "keep";
      var was = document.createElement("span");
      was.className = "was";
      was.textContent = step[0];
      var now = document.createElement("span");
      now.className = "now";
      now.textContent = step[1];
      li.appendChild(was);
      li.appendChild(now);
      list.appendChild(li);
    });
    status.textContent = flow.status;
  }

  function setDone(done) {
    note.classList.toggle("done", done);
    toggle.textContent = done ? "Vorher zeigen" : "Nachher zeigen";
  }

  function play() {
    setDone(false);
    if (reduced) { setDone(true); return; }
    // Two frames so the browser paints the "before" state first.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { setDone(true); });
    });
  }

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    list.setAttribute("aria-labelledby", tab.id);
    if (focus) tab.focus();
    render(tab.getAttribute("data-flow"));
    play();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (event) {
      var next = null;
      if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (event.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); select(next, true); }
    });
  });

  toggle.addEventListener("click", function () {
    setDone(!note.classList.contains("done"));
  });

  // The one orchestrated moment: rewrite the note shortly after it scrolls into view.
  setDone(false);
  if (reduced || !("IntersectionObserver" in window)) {
    setDone(true);
    return;
  }
  var seen = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      seen.disconnect();
      setTimeout(function () { setDone(true); }, 700);
    }
  }, { threshold: 0.6 });
  seen.observe(note);
})();
