const fs = require('fs');
const path = require('path');

const PAGES = [
  'Главная.dc.html',
  'Калькулятор.dc.html',
  'Лофт-мебель.dc.html',
  'Документация.dc.html',
  'Прайс.dc.html',
  'create.html'
];

function stripBalancedBlock(source, start) {
  const open = source.indexOf('{', start);
  if (open < 0) return source;
  let depth = 0;
  let quote = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === quote && source[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(0, start) + source.slice(i + 1);
    }
  }
  return source;
}

function removeCssSelectors(css) {
  const legacy = /(?:^|})\s*([^{}]+)\{/g;
  let result = css;
  let match;
  while ((match = legacy.exec(result))) {
    const selector = match[1].trim();
    if (/\.header\b|\.nav\b|\.brand\b|\.navlinks\b|\.phone\b|@keyframes\s+logoflash\b/i.test(selector)) {
      const start = match.index + match[0].length - 1;
      result = stripBalancedBlock(result, start);
      legacy.lastIndex = Math.max(0, match.index);
    }
  }
  return result;
}

function transform(html, file) {
  let out = html;

  // Replace every legacy page header with one explicit server-side slot.
  out = out.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '<header id="site-header-slot" class="site-header"></header>');

  // Remove legacy scroll-to-top markup if a page still contains it.
  out = out.replace(/<[^>]+(?:id=["']totop["']|class=["'][^"']*\bsite-top\b[^"']*)[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

  // Remove legacy header-only CSS from inline page styles.
  out = out.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (whole, css) => `<style>${removeCssSelectors(css)}</style>`);

  // Exactly one loader tag per page.
  out = out.replace(/<script\s+[^>]*\/site-ui\.js(?:\?[^"']*)?[^>]*><\/script>/gi, '');
  out = out.replace(/<\/body>/i, '  <script src="/site-ui.js?v=20260913-6" defer></script>\n</body>');

  return out;
}

for (const file of PAGES) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) throw new Error(`Missing page: ${file}`);
  const original = fs.readFileSync(full, 'utf8');
  const transformed = transform(original, file);
  fs.writeFileSync(full, transformed, 'utf8');
  const headers = (transformed.match(/<header\b/gi) || []).length;
  const loaders = (transformed.match(/<script\s+[^>]*\/site-ui\.js/gi) || []).length;
  if (headers !== 1) throw new Error(`${file}: expected 1 header, got ${headers}`);
  if (loaders !== 1) throw new Error(`${file}: expected 1 site-ui loader, got ${loaders}`);
  console.log(`normalized ${file}: 1 header, 1 site-ui loader`);
}
