const fs = require('fs');
const path = require('path');

const PAGES = new Set([
  'Главная.dc.html',
  'Калькулятор.dc.html',
  'Лофт-мебель.dc.html',
  'Документация.dc.html',
  'Прайс.dc.html',
  'create.html'
]);

function injectAssets(html, file) {
  let result = html;

  if (!result.includes('assets/favicon.svg')) {
    result = result.replace('</head>', '  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">\n  <meta name="theme-color" content="#11131a">\n</head>');
  }

  if (!result.includes('href="/mobile.css"') && !result.includes('href="mobile.css"')) {
    result = result.replace('</head>', '  <link rel="stylesheet" href="/mobile.css">\n</head>');
  }

  if (!result.includes('/site-ui.js')) {
    result = result.replace('</body>', '  <script src="/site-ui.js?v=20260913-2" defer></script>\n</body>');
  } else {
    result = result.replace(/\/site-ui\.js(?:\?[^"']*)?/g, '/site-ui.js?v=20260913-2');
  }

  return result;
}

module.exports = (req, res) => {
  try {
    const file = decodeURIComponent(String(req.query?.file || ''));
    if (!PAGES.has(file)) {
      res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('Page not found');
    }
    const fullPath = path.join(process.cwd(), file);
    const html = fs.readFileSync(fullPath, 'utf8');
    const output = injectAssets(html, file);
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.end(output);
  } catch (error) {
    console.error('page renderer error:', error);
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Page rendering error');
  }
};
