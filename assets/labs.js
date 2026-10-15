// ZippoWorkz Labs: kleine Demos für Creator Studio und Markets Lab.
// Beispieldaten, alles nur im Browser, nichts wird gesendet oder gespeichert.
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var pkg = document.getElementById("pkg");
  if (pkg) {
    var state = document.getElementById("pkg-state"), msg = document.getElementById("pkg-msg");
    var texts = {
      approve: ["Freigegeben (Demo)", "pill-done", "Nur lokal in die Warteschlange gelegt. Die Live-Freigabe ist ein eigener Schritt, gesendet wurde nichts."],
      change: ["Überarbeitung", "pill-work", "Zurück an das Team mit deinem Kommentar. Das Paket bleibt gesperrt, bis es neu geprüft ist."],
      reject: ["Abgelehnt", "pill-off", "Paket blockiert. Es wird nicht veröffentlicht."]
    };
    pkg.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pkg]"); if (!b) return;
      var t = texts[b.getAttribute("data-pkg")];
      state.textContent = t[0]; state.className = "pill " + t[1]; msg.textContent = t[2];
      pkg.setAttribute("data-state", b.getAttribute("data-pkg"));
    });
  }

  var pipe = document.getElementById("pipeline"), run = document.getElementById("pipe-run");
  if (pipe && run) {
    var steps = Array.prototype.slice.call(pipe.children), timer;
    run.addEventListener("click", function () {
      clearTimeout(timer);
      steps.forEach(function (s) { s.classList.remove("on"); });
      pipe.style.setProperty("--p", 0);
      var i = 0;
      (function next() {
        if (i >= steps.length) { run.textContent = "Nochmal zeigen"; return; }
        steps[i].classList.add("on");
        pipe.style.setProperty("--p", (i + 1) / steps.length);
        i++;
        timer = setTimeout(next, reduced ? 0 : 750);
      })();
    });
  }
})();
