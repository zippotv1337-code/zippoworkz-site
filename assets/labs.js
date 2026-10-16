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

  // Ein Lichtpunkt läuft die Stufen ab, sobald der Ablauf im Bild ist. Bei reduzierter Bewegung bleibt alles still beleuchtet.
  var pipe = document.getElementById("pipeline");
  if (pipe && !reduced && "IntersectionObserver" in window) {
    var steps = Array.prototype.slice.call(pipe.children);
    var measure = function () {
      var vertical = steps[1].offsetTop > steps[0].offsetTop;
      var pos = function (s) { return vertical ? s.offsetTop : s.offsetLeft; };
      var len = pos(steps[steps.length - 1]) - pos(steps[0]);
      pipe.style.setProperty("--len", len + "px");
      steps.forEach(function (s) { s.style.setProperty("--f", (len ? (pos(s) - pos(steps[0])) / len : 0).toFixed(3)); });
    };
    measure();
    window.addEventListener("resize", measure);
    pipe.classList.add("armed");
    new IntersectionObserver(function (entries, io) {
      if (!entries[0].isIntersecting) return;
      pipe.classList.add("flowing");
      io.disconnect();
    }, { threshold: 0.5 }).observe(pipe);
  }
})();
