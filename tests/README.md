# Labs browser regression

Run with existing Node, Playwright and Chromium; no package installation is performed by the test.

    node --test tests/labs-regression.cjs

If Playwright or the browser already lives outside the usual module/browser paths,
set `ZW_TEST_PLAYWRIGHT_PATH` (module path) and `ZW_TEST_BROWSER` (executable path)
for that test process. No credentials are needed.

The isolated browser uses a temporary loopback-only HTTP server with the actual
`.htaccess` CSP. External and non-GET requests are rejected. Both regressions
must fail without their fixes: preview variables under `style-src 'self'`, and
zero pipeline transition duration under `prefers-reduced-motion: reduce`.

## Pricing V1 regression

Checks the three approved public pricing anchors, stale legacy prices, sales-led
hero focus and the animation hooks that must survive pricing/content changes.

    node --test tests/pricing-regression.cjs
