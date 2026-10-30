// ZippoWorkz: cineastische Hintergrund-Szenen (Owner 30.10.2026, inspiriert von monsterhunter.com/wilds).
// Jeder Abschnitt nennt per data-scene seine Szene; beim Scrollen blendet .scene weich um.
// Leichter Parallax nur ohne "Bewegung reduzieren". Reine Dekoration, keine Abhängigkeiten.
(function () {
  "use strict";
  var scene = document.querySelector(".scene");
  if (!scene) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var marks = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
  if (!marks.length) return;

  function pick() {
    var mid = window.innerHeight * 0.45, best = marks[0];
    for (var i = 0; i < marks.length; i++) {
      var r = marks[i].getBoundingClientRect();
      if (r.top <= mid) best = marks[i];   // last section whose top passed the reading line
      else break;
    }
    var name = best.getAttribute("data-scene");
    if (scene.getAttribute("data-scene") !== name) scene.setAttribute("data-scene", name);
  }

  var queued = false;
  function update() {
    queued = false;
    pick();
    if (!reduced) scene.style.setProperty("--scene-p", String(Math.round(window.scrollY * 0.05)));
  }
  function schedule() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
})();
