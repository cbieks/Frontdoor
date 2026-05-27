// Sample HTML fixtures for manually verifying classifyHtml() output.
// Not a test runner — just exported strings you can feed to classifyHtml
// in a REPL / scratch script to spot-check the regex layer.
//
// Quick check from a script:
//   import { classifyHtml } from "@/lib/scoring/heuristics";
//   import { MODERN_NEXTJS, OUTDATED_WP_TWENTYTWELVE } from "@/lib/scoring/heuristics.test-fixtures";
//   console.log(classifyHtml(MODERN_NEXTJS, "https://modern.example"));

const CURRENT_YEAR = new Date().getFullYear();

export const MODERN_NEXTJS = `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/_next/static/css/abcd.css">
  <style>body { font-family: Inter, system-ui, sans-serif; }</style>
</head>
<body>
  <div class="flex items-center justify-between gap-4 md:gap-6 hover:bg-gray-50">
    <div class="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 hover:shadow">Hi</div>
    <div class="flex items-center gap-2 hover:underline md:flex-row">x</div>
  </div>
  <script src="/_next/static/chunks/main.js"></script>
  <footer>© ${CURRENT_YEAR} Modern Co</footer>
</body>
</html>`;

export const OUTDATED_WP_TWENTYTWELVE = `<!doctype html>
<html>
<head>
  <title>Joe's Plumbing</title>
  <link rel="stylesheet" href="/wp-content/themes/twentytwelve/style.css">
  <script src="/wp-content/plugins/foo/jquery-1.7.2.min.js"></script>
</head>
<body>
  <font color="#444">Welcome to my new website</font>
  <table border="1">
    <tr><td>Service</td></tr>
  </table>
  <table>
    <tr><td>About</td></tr>
  </table>
  <table>
    <tr><td>Contact</td></tr>
  </table>
  <footer>Copyright © 2015 Joe's Plumbing</footer>
</body>
</html>`;

export const AMBIGUOUS_NO_VIEWPORT_BUT_NO_LEGACY = `<!doctype html>
<html>
<head>
  <title>Acme Salon</title>
  <style>body { font-family: Georgia, serif; }</style>
</head>
<body>
  <h1>Acme Salon</h1>
  <p>Cuts, color, blowouts</p>
  <footer>© ${CURRENT_YEAR - 1} Acme</footer>
</body>
</html>`;

// Expected behavior:
// MODERN_NEXTJS         → verdict: "auto-reject-modern"
//                         modernSignals: ["nextjs", "tailwind-density", "modern-baseline"]
//                         outdatedSignals: []
// OUTDATED_WP_TWENTYTWELVE → verdict: "needs-vision"
//                         modernSignals: []
//                         outdatedSignals includes:
//                           ["wp-default-old-theme", "no-viewport", "stale-copyright",
//                            "old-jquery", "table-layout", "deprecated-html", "placeholder-content"]
// AMBIGUOUS_NO_VIEWPORT_BUT_NO_LEGACY → verdict: "needs-vision"
//                         modernSignals: []
//                         outdatedSignals: ["no-viewport"]
