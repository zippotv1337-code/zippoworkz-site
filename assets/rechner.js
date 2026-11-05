// Zeit-Rechner im Ratgeber. Rechnet nur mit den eigenen Eingaben, läuft im Browser, sendet nichts.
(function () {
  "use strict";
  var WEEKS_PER_MONTH = 52 / 12;

  function calc(requests, minutes, rate) {
    var month = requests * minutes * WEEKS_PER_MONTH / 60;
    return { month: month, year: month * 12, cost: rate > 0 ? month * rate : null };
  }
  if (typeof module !== "undefined") module.exports = { calc: calc };

  var form = typeof document !== "undefined" && document.getElementById("rechner");
  if (!form) return;
  var fields = { requests: form.elements.requests, minutes: form.elements.minutes, rate: form.elements.rate };
  var out = { month: document.getElementById("r-month"), year: document.getElementById("r-year"), cost: document.getElementById("r-cost"), costRow: document.getElementById("r-cost-row") };
  var cta = document.getElementById("r-cta");
  var hours = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function value(input, max) { var n = Number(input.value); return n > 0 ? Math.min(n, max) : 0; }

  function update() {
    var requests = value(fields.requests, 10000), minutes = value(fields.minutes, 240), rate = value(fields.rate, 1000);
    var r = calc(requests, minutes, rate);
    out.month.textContent = hours.format(r.month) + " Std.";
    out.year.textContent = hours.format(r.year) + " Std.";
    out.costRow.hidden = r.cost === null;
    if (r.cost !== null) out.cost.textContent = euro.format(r.cost);
    var body = "Hallo ZippoWorkz,\n\nunsere Schätzung aus dem Zeit-Rechner: " + requests + " Anfragen pro Woche, " + minutes + " Minuten pro Anfrage, also etwa " + hours.format(r.month) + " Stunden im Monat.\n\nSo läuft es heute ab:\n\n";
    cta.href = "mailto:info@zippoworkz.com?subject=" + encodeURIComponent("Ablauf-Check") + "&body=" + encodeURIComponent(body);
  }
  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();
