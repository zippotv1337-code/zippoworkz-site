// ZippoWorkz: die Welle aus dem Banner. Sie kommt im Kopfbereich herein
// und fließt beim Scrollen die ganze Seite hinunter. Reine Dekoration,
// rein im Browser, ohne Abhängigkeiten.
(function () {
  "use strict";
  var canvas = document.getElementById("stream");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CYAN = [12, 198, 255], VIOLET = [124, 77, 255];

  var W = 0, H = 0, dpr = 1, docH = 0, narrow = false;
  var spine = [];            // {x, y, nx, ny, s}
  var heroTop = 0, heroBottom = 0;
  var stars = [];

  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return [
      0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    ];
  }

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    narrow = W < 760;
    docH = Math.max(document.documentElement.scrollHeight, H);
    var hero = document.querySelector(".hero");
    var r = hero ? hero.getBoundingClientRect() : { top: 0, height: H };
    heroTop = r.top + window.scrollY;
    heroBottom = heroTop + Math.min(r.height, H * 1.1);
    var mid = heroTop + Math.min(r.height, H) * (narrow ? 0.32 : 0.36);
    var side = narrow ? 0.97 : 0.86;

    // Control points: across the hero like the banner, then down the page.
    var pts = [
      [W * (narrow ? 0.0 : 0.34), mid + 10],
      [W * (narrow ? 0.45 : 0.58), mid - 10],
      [W * (narrow ? 0.85 : 0.80), mid + 30],
      [W * side, mid + H * 0.42]
    ];
    var y = mid + H * 0.45, k = 0;
    while (y < docH + 400) {
      y += narrow ? 520 : 720;
      k++;
      pts.push([W * (side + (k % 2 ? -0.06 : 0.03) * (narrow ? 0.3 : 1)), y]);
    }
    var ext = [[pts[0][0] - 200, pts[0][1] + 40]].concat(pts, [[pts[pts.length - 1][0], pts[pts.length - 1][1] + 400]]);
    spine = [];
    var s = 0, prev = null;
    for (var i = 1; i < ext.length - 2; i++) {
      for (var j = 0; j < 1; j += 0.01) {
        var p = catmull(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], j);
        if (prev) {
          var dx = p[0] - prev[0], dy = p[1] - prev[1];
          var len = Math.hypot(dx, dy);
          if (len < 5) continue;
          s += len;
          spine.push({ x: p[0], y: p[1], nx: -dy / len, ny: dx / len, s: s });
        }
        prev = p;
      }
    }
    // A faint network of points in the hero, as in the banner.
    stars = [];
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var n = 0; n < (narrow ? 16 : 34); n++) {
      stars.push([rnd() * W, heroTop + rnd() * (heroBottom - heroTop)]);
    }
  }

  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // Three bundles of fine lines, cyan to violet, like the banner.
  var BUNDLES = 3, LINES = 7;
  function draw(time) {
    var t = reduced ? 0 : time / 1000;
    var top = window.scrollY;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // network
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

    // visible part of the spine
    var first = -1, lastIdx = -1;
    for (var k = 0; k < spine.length; k++) {
      var yy = spine[k].y - top;
      if (yy > -260 && yy < H + 260) { if (first < 0) first = k; lastIdx = k; }
    }
    if (first < 0) return;

    var scale = narrow ? 0.5 : 1;
    var lineGap = 4.2 * scale, bundleGap = 46 * scale, amp = 54 * scale;
    ctx.lineWidth = narrow ? 0.8 : 1;
    var CHUNK = 6;
    for (var b = 0; b < BUNDLES; b++) {
      for (var l = 0; l < LINES; l++) {
        var c = mix(CYAN, VIOLET, (b * LINES + l) / (BUNDLES * LINES - 1));
        var rgb = Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]);
        var px = null, py = null, n = 0, alphaSum = 0;
        ctx.beginPath();
        for (var i = first; i <= lastIdx; i++) {
          var q = spine[i];
          var hero = q.y < heroBottom ? 1 : 0;
          var heroBoost = 1 + 0.6 * hero;
          var wave = amp * heroBoost * Math.sin(q.s / 300 + b * 1.9 + t * 0.45);
          var breathe = (1 + 0.35 * Math.sin(q.s / 520 + b + t * 0.3)) * (1 + 0.5 * hero);
          var off = (b - 1) * bundleGap * breathe + wave + (l - (LINES - 1) / 2) * lineGap * breathe;
          var x = q.x + q.nx * off, y = q.y - top + q.ny * off;
          if (px === null) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
          px = x; py = y;
          // Pulses travel along the stream, so it reads as flowing downwards.
          var pulse = 0.5 + 0.5 * Math.sin((q.s - t * 150) / 120 + b * 0.8 + l * 0.12);
          var inHero = q.y < heroBottom ? 1.6 : 0.6;
          var fadeIn = Math.min(1, q.s / 320);
          alphaSum += (0.06 + 0.34 * pulse * pulse) * inHero * fadeIn * (narrow ? 0.7 : 1);
          n++;
          if (n === CHUNK || i === lastIdx) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (alphaSum / n).toFixed(3) + ")";
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y);
            n = 0; alphaSum = 0;
          }
        }
      }
    }
  }

  var visible = true, raf = 0, last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (now - last < 33) return; // about 30 fps is plenty for a background
    last = now;
    draw(now);
  }

  measure();
  draw(performance.now());
  window.addEventListener("resize", function () { measure(); draw(performance.now()); });
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
