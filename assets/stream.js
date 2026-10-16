// ZippoWorkz: die Welle aus dem Banner. Sie schwingt beim Laden von links herein, zieht durch die
// Mitte der Seite und gleitet von dort nach rechts unten. Danach folgt sie dem rechten Rand
// die Seite hinunter. Feine Linien, Cyan zu Violett, weiße Punkte an den Enden und an den Rändern.
// Reine Dekoration, rein im Browser, ohne Abhängigkeiten.
(function () {
  "use strict";
  var canvas = document.getElementById("stream");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CYAN = [12, 198, 255], VIOLET = [124, 77, 255];
  var SPEED = 1700;            // Länge der Welle in px pro Sekunde, während sie ins erste Bild hereinschwingt
  var INTRO = 2400;            // so viel Welle gehört zum ersten Bild; der Rest der Seite füllt sich 8x schneller
  var QUIET_R = 44;            // so weit um eine Textzeile wird die Welle leiser
  var LAG = 14;                // jede Linie läuft ein Stück hinter der vorigen her: die Spitzen fächern sich auf

  var W = 0, H = 0, dpr = 1, docH = 0, narrow = false, scale = 1;
  var spine = [], total = 0, heroEnd = 0, lines = 40;
  var quiet = [], quietTop = 0, quietBottom = 0;
  var stars = [], dots = [], aura = [];
  var t0 = performance.now(), ema = 0, frames = 0;

  // Weicher Lichthof für die Punkte, einmal vorgerendert statt shadowBlur pro Punkt.
  var sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  (function () {
    var g = sprite.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, "rgba(255,255,255,0.95)");
    r.addColorStop(0.22, "rgba(200,230,255,0.38)");
    r.addColorStop(1, "rgba(120,150,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  })();

  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return [
      0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    ];
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // Index der ersten Spine-Stelle mit Länge >= s.
  function indexAt(s) {
    var lo = 0, hi = spine.length - 1;
    while (lo < hi) { var m = (lo + hi) >> 1; if (spine[m].s < s) lo = m + 1; else hi = m; }
    return lo;
  }

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    narrow = W < 760; scale = narrow ? 0.7 : 1;
    docH = Math.max(document.documentElement.scrollHeight, H);
    var hero = document.querySelector(".hero");
    var heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
    function vy(f) { return heroTop + H * f; }
    heroEnd = vy(1.05);
    var side = narrow ? 0.96 : 0.88;

    // Weg der Welle: von links ins Bild, durch die Mitte, nach rechts unten, dann am rechten Rand entlang.
    var pts = [
      [-W * 0.12, vy(narrow ? 0.64 : 0.68)],
      [W * 0.22, vy(narrow ? 0.66 : 0.62)],
      [W * 0.50, vy(narrow ? 0.54 : 0.50)],
      [W * 0.75, vy(narrow ? 0.74 : 0.72)],
      [W * side, vy(1.04)]
    ];
    var endY = Math.max(docH - 140, vy(1.6)), y = vy(1.04), k = 0, step = narrow ? 520 : 720;
    while (y + step < endY) {
      y += step; k++;
      pts.push([W * (side + (k % 2 ? -0.06 : 0.03) * (narrow ? 0.3 : 1)), y]);
    }
    pts.push([W * (side - 0.02), endY]);
    var head = pts[0], tail = pts[pts.length - 1];
    var ext = [[head[0] - 200, head[1] + 40]].concat(pts, [[tail[0], tail[1] + 260]]);
    spine = [];
    var s = 0, prev = null;
    for (var i = 1; i < ext.length - 2; i++) {
      for (var j = 0; j < 1; j += 0.01) {
        var p = catmull(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], j);
        if (prev) {
          var dx = p[0] - prev[0], dy = p[1] - prev[1];
          var len = Math.hypot(dx, dy);
          if (len < 9) continue;
          s += len;
          spine.push({ x: p[0], y: p[1], nx: -dy / len, ny: dx / len, s: s });
        }
        prev = p;
      }
    }
    total = s;
    aura = [{ x: pts[1][0], y: pts[1][1], c: "12,198,255", a: 0.09 }, { x: pts[2][0], y: pts[2][1], c: "80,140,255", a: 0.11 }, { x: pts[4][0], y: pts[4][1], c: "124,77,255", a: 0.14 }];

    // Texte im ersten Bild: die Welle geht dahinter durch und wird dort leiser, damit nichts schwer lesbar wird.
    quiet = []; quietTop = Infinity; quietBottom = -Infinity;
    var els = document.querySelectorAll(".wordmark, .tagline, .lede, .hero .btn, .hero .link, .facts dt, .facts dd, main h1, .slide-title, .hero .kicker");
    for (var e = 0; e < els.length; e++) {
      var box = els[e].matches(".btn, .link") ? els[e] : null, b;
      if (box) b = box.getBoundingClientRect();
      else { var rg = document.createRange(); rg.selectNodeContents(els[e]); b = rg.getBoundingClientRect(); }
      if (!b.width) continue;
      var r = [b.left, b.top + window.scrollY, b.right, b.bottom + window.scrollY];
      quiet.push(r);
      quietTop = Math.min(quietTop, r[1] - QUIET_R); quietBottom = Math.max(quietBottom, r[3] + QUIET_R);
    }

    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    // Leises Punktenetz im ersten Bild, wie im Banner.
    stars = [];
    for (var n = 0; n < (narrow ? 16 : 34); n++) stars.push([rnd() * W, heroTop + rnd() * (heroEnd - heroTop)]);
    // Weiße Punkte an den Rändern der Welle, ein paar auch mittendrin.
    dots = [];
    var sp = 40 + rnd() * 60;
    while (sp < total - 20) {
      var edge = rnd() < 0.72;
      dots.push({
        i: indexAt(sp),
        u: edge ? (rnd() < 0.5 ? -1 : 1) * (0.9 + rnd() * 0.16) : rnd() * 1.4 - 0.7,
        r: 1.2 + rnd() * 1.5, ph: rnd() * 6.28, sp: 0.8 + rnd() * 1.6
      });
      sp += (sp < 2600 ? (narrow ? 46 : 30) + rnd() * 40 : (narrow ? 130 : 90) + rnd() * 110);
    }
  }

  // Bündel aus feinen Linien mit leichter Verdrehung: manchmal laufen sie eng zusammen, manchmal fächern sie auf.
  function boostAt(y) {
    var f = clamp01((heroEnd + 260 - y) / 260);
    return 1 + 0.55 * f * f * (3 - 2 * f);
  }
  function offsetOf(u, q, t, boost) {
    var w = 125 * scale * boost * (0.75 + 0.25 * Math.sin(q.s / 520 + 0.6));
    var twist = 0.5 + 0.5 * Math.cos(q.s / 340 + t * 0.22 + 0.9);
    var swing = 52 * scale * boost * Math.sin(q.s / 300 + t * 0.45);
    var wob = 12 * scale * Math.sin(q.s / 170 + u * 2.3 + t * 0.6);
    return u * w * twist + swing + wob;
  }
  function quietAt(x, y) {
    if (y < quietTop || y > quietBottom) return 1;
    var f = 1;
    for (var n = 0; n < quiet.length; n++) {
      var r = quiet[n];
      var dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < QUIET_R) { var k = d / QUIET_R; f = Math.min(f, 0.34 + 0.66 * k * k * (3 - 2 * k)); }
    }
    return f;
  }
  function dot(x, y, r, a) {
    if (a < 0.02) return;
    ctx.globalAlpha = Math.min(1, a * 0.9);
    ctx.drawImage(sprite, x - r * 4.5, y - r * 4.5, r * 9, r * 9);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
  }

  var CHUNK = 8;
  function strokeChunk(tt, s, t, alpha) {
    var c = mix(CYAN, VIOLET, clamp01(tt + 0.22 * Math.sin(s / 900 + t * 0.1)));
    ctx.strokeStyle = "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + alpha.toFixed(3) + ")";
    ctx.stroke();
  }
  function draw(now) {
    var started = performance.now();
    var t = reduced ? 0 : now / 1000;
    var top = window.scrollY;
    var run = (now - t0) / 1000 * SPEED;
    var front = reduced ? Infinity : run < INTRO ? run : INTRO + (run - INTRO) * 8;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);

    // Lichthöfe hinter der Mitte und hinter dem Ausgang unten rechts.
    for (var g = 0; g < aura.length; g++) {
      var au = aura[g], ay = au.y - top;
      if (ay < -H || ay > 2 * H) continue;
      var rad = Math.max(W * 0.34, 280);
      var grad = ctx.createRadialGradient(au.x, ay, 0, au.x, ay, rad);
      grad.addColorStop(0, "rgba(" + au.c + "," + au.a + ")");
      grad.addColorStop(1, "rgba(" + au.c + ",0)");
      ctx.fillStyle = grad; ctx.fillRect(au.x - rad, ay - rad, rad * 2, rad * 2);
    }

    // Punktenetz
    ctx.lineWidth = 1;
    for (var a = 0; a < stars.length; a++) {
      var sa = stars[a], ya = sa[1] - top;
      if (ya < -200 || ya > H + 200) continue;
      ctx.fillStyle = "rgba(160,180,255,0.35)";
      ctx.fillRect(sa[0], ya, 1.6, 1.6);
      for (var b2 = a + 1; b2 < stars.length; b2++) {
        var sb = stars[b2];
        var d = Math.hypot(sa[0] - sb[0], sa[1] - sb[1]);
        if (d < 150) {
          ctx.strokeStyle = "rgba(120,140,220," + (0.12 * (1 - d / 150)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(sa[0], ya); ctx.lineTo(sb[0], sb[1] - top); ctx.stroke();
        }
      }
    }

    // sichtbarer Teil des Wegs
    var first = -1, lastIdx = -1;
    for (var k = 0; k < spine.length; k++) {
      var yy = spine[k].y - top;
      if (yy > -300 && yy < H + 300) { if (first < 0) first = k; lastIdx = k; }
    }
    if (first >= 0) {
      ctx.globalCompositeOperation = "lighter";
      var base = narrow ? 0.8 : 1;
      for (var l = 0; l < lines; l++) {
        var u = lines === 1 ? 0 : (l / (lines - 1)) * 2 - 1;
        var tt = (u + 1) / 2;
        var frontL = front - l * LAG, endS = total - l * 9;
        var edgeBoost = 0.85 + 0.35 * Math.abs(u);
        ctx.lineWidth = narrow ? 0.9 : (Math.abs(u) > 0.88 ? 1.35 : 1.1);
        var n = 0, aSum = 0;
        ctx.beginPath();
        for (var i = first; i <= lastIdx; i++) {
          var q = spine[i];
          if (q.s > frontL || q.s > endS) break;
          var boost = boostAt(q.y);
          var off = offsetOf(u, q, t, boost);
          var x = q.x + q.nx * off, yd = q.y + q.ny * off, y = yd - top;
          if (n === 0 && i === first) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          var pulse = 0.5 + 0.5 * Math.sin((q.s - t * 170) / 150 + l * 0.32);
          var hero = (boost - 1) / 0.55;
          var al = (0.11 + 0.58 * pulse * pulse * pulse) * (0.8 + 1.0 * hero) * edgeBoost * base
            * Math.min(1, q.s / 240) * clamp01((frontL - q.s) / 120) * clamp01((endS - q.s) / 140) * quietAt(x, yd);
          aSum += al; n++;
          if (n === CHUNK) {
            strokeChunk(tt, q.s, t, aSum / n);
            ctx.beginPath(); ctx.moveTo(x, y);
            n = 0; aSum = 0;
          }
        }
        if (n > 0) strokeChunk(tt, spine[Math.min(i, lastIdx)].s, t, aSum / n);
      }

      // Weiße Punkte: Spitzen der hereinschwingenden Welle, Enden unten, Ränder dazwischen.
      for (var l2 = 0; l2 < lines; l2++) {
        var u2 = lines === 1 ? 0 : (l2 / (lines - 1)) * 2 - 1;
        var fl = front - l2 * LAG, es = total - l2 * 9, tw = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(t * 1.7 + l2);
        var pos = [];
        if (fl > 0 && fl < es && fl < total) pos.push([fl, 1]);                 // laufende Spitze
        if (front >= es) pos.push([es, 0.5 + 0.4 * tw]);                         // Ende der Linie
        for (var m = 0; m < pos.length; m++) {
          var qi = indexAt(pos[m][0]);
          if (qi < first || qi > lastIdx) continue;
          var qq = spine[qi], bo = boostAt(qq.y), of2 = offsetOf(u2, qq, t, bo);
          var px = qq.x + qq.nx * of2, py = qq.y + qq.ny * of2;
          dot(px, py - top, 1.9 * Math.max(scale, 0.8), pos[m][1] * quietAt(px, py));
        }
      }
      for (var dI = 0; dI < dots.length; dI++) {
        var dd = dots[dI];
        if (dd.i < first || dd.i > lastIdx) continue;
        var dq = spine[dd.i];
        var lagD = (dd.u + 1) / 2 * (lines - 1) * LAG;
        if (dq.s > front - lagD - 30) continue;
        var db = boostAt(dq.y), dof = offsetOf(dd.u, dq, t, db);
        var dx2 = dq.x + dq.nx * dof, dy2 = dq.y + dq.ny * dof;
        var twk = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(t * dd.sp + dd.ph);
        var dh = 0.6 + 0.4 * ((db - 1) / 0.55);
        dot(dx2, dy2 - top, dd.r * Math.max(scale, 0.8), (0.5 + 0.5 * twk * twk) * dh * clamp01((front - lagD - dq.s) / 160) * quietAt(dx2, dy2));
      }
    }

    // Sparsam bleiben: wenn ein Gerät das Zeichnen nicht schafft, werden Linien weggenommen.
    ema = ema * 0.9 + (performance.now() - started) * 0.1;
    if (++frames > 20 && ema > 11 && lines > 18) { lines = Math.max(18, Math.round(lines * 0.75)); ema = 0; frames = 0; }
  }

  var visible = true, raf = 0, last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (now - last < 33) return; // etwa 30 fps reichen für einen Hintergrund
    last = now;
    draw(now);
  }

  lines = window.innerWidth < 760 ? 24 : 40;
  measure();
  draw(performance.now());
  window.addEventListener("resize", function () { lines = window.innerWidth < 760 ? 24 : 40; measure(); draw(performance.now()); });
  if ("ResizeObserver" in window) new ResizeObserver(function () {
    var h = document.documentElement.scrollHeight;
    if (Math.abs(h - docH) > 40) { measure(); draw(performance.now()); }
  }).observe(document.body);
  if (reduced) {
    window.addEventListener("scroll", function () { draw(0); }, { passive: true });
  } else {
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; });
    raf = requestAnimationFrame(loop);
  }
})();
