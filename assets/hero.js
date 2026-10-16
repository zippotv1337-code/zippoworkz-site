/* Hero-Slider (16.10.2026): drei Folien wie ein Film, angelehnt an Video-Slider mit Korn-Überblendung.
   Die Welle aus stream.js läuft darunter weiter und ist Folie 1. Folie 2 sortiert Lichtpunkte in Bahnen,
   Folie 3 zeigt ein Freigabe-Tor mit Fehlerpfad. Ohne JavaScript bleibt Folie 1 stehen. */
(function () {
  "use strict";
  var hero = document.querySelector(".hero");
  var slides = hero ? [].slice.call(hero.querySelectorAll(".slide")) : [];
  if (slides.length < 2) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = 7500;
  var current = 0, elapsed = 0, last = 0, paused = reduced, hold = false, visible = true;
  var dots = [].slice.call(hero.querySelectorAll(".slide-dot"));
  var pauseBtn = hero.querySelector(".slide-pause");
  var grain = hero.querySelector(".slide-grain");
  hero.classList.add("is-slider");
  slides.forEach(function (s, n) { if (n) { s.setAttribute("aria-hidden", "true"); s.inert = true; } });

  function setProgress(p) {
    dots.forEach(function (d, n) { d.style.setProperty("--p", n === current ? p.toFixed(3) : "0"); });
  }

  function show(i) {
    i = (i + slides.length) % slides.length;
    if (i === current) return;
    var out = slides[current], inn = slides[i];
    out.classList.remove("is-active");
    out.classList.add("is-leaving");
    out.setAttribute("aria-hidden", "true");
    out.inert = true;
    setTimeout(function () { out.classList.remove("is-leaving"); }, 900);
    inn.classList.add("is-active");
    inn.removeAttribute("aria-hidden");
    inn.inert = false;
    dots.forEach(function (d, n) { d.setAttribute("aria-current", n === i ? "true" : "false"); });
    if (grain && !reduced) { grain.classList.remove("flash"); void grain.offsetWidth; grain.classList.add("flash"); }
    current = i;
    elapsed = 0;
    setProgress(0);
    scene.target = inn.getAttribute("data-scene") || "flow";
  }

  function setPaused(p) {
    paused = p;
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", p ? "true" : "false");
      pauseBtn.setAttribute("aria-label", p ? "Automatischen Wechsel starten" : "Automatischen Wechsel anhalten");
      pauseBtn.classList.toggle("is-paused", p);
    }
  }
  setPaused(paused);

  hero.querySelector(".slide-arrow.prev").addEventListener("click", function () { show(current - 1); });
  hero.querySelector(".slide-arrow.next").addEventListener("click", function () { show(current + 1); });
  dots.forEach(function (d, n) { d.addEventListener("click", function () { show(n); }); });
  if (pauseBtn) pauseBtn.addEventListener("click", function () { setPaused(!paused); });

  var area = hero.querySelector(".slides");
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    area.addEventListener("mouseenter", function () { hold = true; });
    area.addEventListener("mouseleave", function () { hold = false; });
  }
  hero.addEventListener("focusin", function () { hold = true; });
  hero.addEventListener("focusout", function () { hold = false; });
  hero.querySelector(".slide-ui").addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { show(current - 1); e.preventDefault(); }
    if (e.key === "ArrowRight") { show(current + 1); e.preventDefault(); }
  });
  var downX = null;
  area.addEventListener("pointerdown", function (e) { downX = e.clientX; });
  area.addEventListener("pointerup", function (e) {
    if (downX === null) return;
    var dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 60) show(current + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("visibilitychange", function () { last = 0; });

  /* Szenen: leicht, nur rechts vom Text, nichts davon ist Daten. */
  var cv = hero.querySelector(".slide-scene"), ctx = cv && cv.getContext("2d");
  var W = 0, H = 0, narrow = false, limit = 0;
  var scene = { target: slides[0].getAttribute("data-scene") || "flow", alpha: { flow: 1, sort: 0, gate: 0 } };
  var parts = [];
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  function resize() {
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), r = hero.getBoundingClientRect();
    W = r.width; H = r.height; narrow = W < 760;
    var facts = hero.querySelector(".facts");
    limit = facts ? facts.getBoundingClientRect().top - r.top : H;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(kind) {
    return { kind: kind, t: -rnd() * 1.2, speed: 0.11 + rnd() * 0.07, lane: Math.floor(rnd() * 5), y0: (rnd() - 0.5) * 70, bad: rnd() < 0.17 };
  }
  for (var n = 0; n < 34; n++) { parts.push(spawn("sort")); parts.push(spawn("gate")); }

  function bez(p0, p1, p2, t) { var u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }

  function dot(x, y, r, color, a) {
    ctx.globalAlpha = a * 0.35; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.283); ctx.fill();
    ctx.globalAlpha = a; ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  function drawSort(a, dt) {
    var ox = W * (narrow ? 0.5 : 0.58), oy = narrow ? limit * 0.8 : H * 0.44;
    var ends = [];
    for (var k = 0; k < 5; k++) ends.push([W + 30, narrow ? limit * (0.6 + k * 0.09) : H * (0.16 + k * 0.15)]);
    ctx.lineWidth = 1;
    ends.forEach(function (e) {
      var g = ctx.createLinearGradient(ox, oy, e[0], e[1]);
      g.addColorStop(0, "rgba(124,77,255,0)"); g.addColorStop(1, "rgba(12,198,255,0.55)");
      ctx.strokeStyle = g; ctx.globalAlpha = a * 0.9; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(W * 0.8, oy, e[0], e[1]); ctx.stroke();
    });
    parts.forEach(function (p) {
      if (p.kind !== "sort") return;
      p.t += p.speed * dt;
      if (p.t > 2) { Object.assign(p, spawn("sort"), { t: 0 }); }
      if (p.t < 0) return;
      var x, y;
      if (p.t < 1) { x = -20 + (ox + 20) * p.t; y = oy + p.y0 * (1 - p.t); }
      else { var s = p.t - 1, e = ends[p.lane]; x = bez(ox, W * 0.8, e[0], s); y = bez(oy, oy, e[1], s); }
      dot(x, y, narrow ? 1.8 : 2.4, "#0cc6ff", a * Math.min(1, p.t * 4));
    });
  }

  function drawGate(a, dt) {
    var gx = W * (narrow ? 0.9 : 0.68), top = narrow ? limit * 0.55 : H * 0.18, bot = narrow ? limit * 0.95 : H * 0.82, my = (top + bot) / 2;
    var g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(12,198,255,0)"); g.addColorStop(0.5, "rgba(12,198,255,0.9)"); g.addColorStop(1, "rgba(124,77,255,0)");
    ctx.globalAlpha = a; ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.shadowColor = "#0cc6ff"; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, bot); ctx.stroke();
    ctx.shadowBlur = 0;
    parts.forEach(function (p) {
      if (p.kind !== "gate") return;
      p.t += p.speed * dt * 0.9;
      if (p.t > 2) { Object.assign(p, spawn("gate"), { t: 0 }); }
      if (p.t < 0) return;
      var x, y, color = "#0cc6ff";
      var yy = my + p.y0 * 1.6 + Math.sin(p.t * 3 + p.lane) * 10;
      if (p.t < 1) { x = -20 + (gx + 20) * p.t; y = yy; }
      else if (p.bad) { var s = p.t - 1; x = gx + s * 60; y = yy + s * s * (H - yy + 40); color = "#ffc66b"; }
      else { var s2 = p.t - 1; x = gx + s2 * (W - gx + 40); y = yy - s2 * 30; color = "#3fe0b0"; }
      if (p.t >= 1 && p.t < 1.08) {
        ctx.globalAlpha = a * (1 - (p.t - 1) / 0.08) * 0.7; ctx.strokeStyle = color; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(gx, y, 6 + (p.t - 1) * 160, 0, 6.283); ctx.stroke();
      }
      dot(x, y, narrow ? 1.8 : 2.4, color, a * Math.min(1, p.t * 4));
    });
  }

  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!paused && !hold && visible && !document.hidden) {
      elapsed += dt * 1000;
      if (elapsed >= DUR) show(current + 1); else setProgress(elapsed / DUR);
    }
    if (ctx && visible) {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ["flow", "sort", "gate"].forEach(function (k) {
        var to = scene.target === k ? 1 : 0;
        scene.alpha[k] += (to - scene.alpha[k]) * Math.min(1, dt * 2.2);
      });
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, limit); ctx.clip();
      if (scene.alpha.sort > 0.01) drawSort(scene.alpha.sort, dt);
      if (scene.alpha.gate > 0.01) drawGate(scene.alpha.gate, dt);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; last = 0; }).observe(hero);
  }
  if (!reduced) {
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }
})();
