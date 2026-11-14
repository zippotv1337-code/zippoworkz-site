// Leak fix demo: the same booking app before and after a Supabase-style RLS fix. Sample data only, no backend.
const SAMPLE = [
  { id: 1, owner: "anna", date: "2026-12-02", service: "Haircut", price: 45 },
  { id: 2, owner: "anna", date: "2026-12-09", service: "Colour", price: 89 },
  { id: 3, owner: "anna", date: "2026-12-16", service: "Styling", price: 35 },
  { id: 4, owner: "ben", date: "2026-12-03", service: "Haircut", price: 39 },
  { id: 5, owner: "ben", date: "2026-12-10", service: "Styling", price: 30 },
  { id: 6, owner: "ben", date: "2026-12-18", service: "Colour", price: 95 },
];

const CHECKS = {
  before: [
    { ok: false, name: "Row level security", detail: "policy bookings_select USING (true)" },
    { ok: false, name: "Auth redirect", detail: "redirect_to = http://localhost:3000" },
    { ok: false, name: "Keys in browser", detail: "service_role key found in bundle.js" },
    { ok: true, name: "Build", detail: "vite build passed" },
  ],
  after: [
    { ok: true, name: "Row level security", detail: "USING (auth.uid() = owner_id)" },
    { ok: true, name: "Auth redirect", detail: "redirect_to = https://your-app.example" },
    { ok: true, name: "Keys in browser", detail: "anon key only, secret on server" },
    { ok: true, name: "Build", detail: "vite build passed, deployed" },
  ],
};

// What the database returns for the signed-in user. Before the fix the policy is USING (true), so every row comes back.
function visibleBookings(all, user, mode) {
  return all.filter(b => mode === "before" || b.owner === user).sort((a, b) => a.date.localeCompare(b.date));
}

function validate(input) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || "")) errors.date = "Please pick a date.";
  if (!input.service) errors.service = "Please choose a service.";
  const price = Number(input.price);
  if (!input.price || !Number.isFinite(price) || price <= 0) errors.price = "Enter a price above 0.";
  return errors;
}

if (typeof module !== "undefined") {
  module.exports = { SAMPLE, visibleBookings, validate };
} else {
  const KEY = "zw-leak-demo-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || SAMPLE.slice(); } catch { return SAMPLE.slice(); } };
  const save = rows => { try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch { /* private mode: keep in memory */ } };
  const state = { mode: "before", user: "anna", rows: load() };
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
  const day = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const name = u => u === "anna" ? "Anna" : "Ben";

  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function render() {
    const before = state.mode === "before";
    document.body.className = state.mode;
    document.querySelectorAll(".mode button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
    $("headline").textContent = before ? "Every user can see every booking" : "Each user sees only their own bookings";
    $("lead").textContent = before
      ? "This is how many AI-built apps go live: the database rule lets anyone read all rows, login sends users to localhost, and a secret key ships in the browser."
      : "Same app after the fix: a real RLS policy, the live redirect URL and the secret key moved to the server. Tested on the live URL.";

    const checks = CHECKS[state.mode];
    $("score").textContent = checks.filter(c => c.ok).length + " / " + checks.length;
    const box = $("checks"); box.replaceChildren();
    checks.forEach(c => { const n = el("div", "check " + (c.ok ? "ok" : "bad")); n.append(el("b", null, (c.ok ? "✓ " : "✗ ") + c.name), el("code", null, c.detail)); box.append(n); });

    const rows = visibleBookings(state.rows, state.user, state.mode);
    const leaks = rows.filter(r => r.owner !== state.user).length;
    $("query").textContent = "select * from bookings;  -- signed in as " + name(state.user) + "\n→ " + rows.length + " rows" +
      (leaks ? "  (" + leaks + " belong to another customer)" : "  (only own rows)");

    const list = $("list"); list.replaceChildren();
    if (!rows.length) list.append(el("li", "empty", "No bookings yet."));
    rows.forEach(r => {
      const mine = r.owner === state.user;
      const li = el("li", mine ? "mine" : "leak");
      const title = el("span", null, r.service);
      if (!mine) title.append(el("span", "tag leak", "LEAK · " + name(r.owner)));
      li.append(title, el("span", "price", money.format(r.price)), el("span", "meta", day(r.date) + (mine ? " · your booking" : " · someone else's data")));
      list.append(li);
    });
  }

  document.querySelectorAll(".mode button").forEach(b => b.addEventListener("click", () => { state.mode = b.dataset.mode; render(); }));
  $("user").addEventListener("change", e => { state.user = e.target.value; render(); });
  $("reset").addEventListener("click", () => { state.rows = SAMPLE.slice(); save(state.rows); render(); });

  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const input = { date: $("date").value, service: $("service").value, price: $("price").value };
    const errors = validate(input);
    ["date", "service", "price"].forEach(f => { $(f + "-err").textContent = errors[f] || ""; $(f).setAttribute("aria-invalid", String(!!errors[f])); });
    if (Object.keys(errors).length) return;
    state.rows.push({ id: Date.now(), owner: state.user, date: input.date, service: input.service, price: Number(input.price) });
    save(state.rows);
    e.target.reset();
    render();
  });

  render();
}
