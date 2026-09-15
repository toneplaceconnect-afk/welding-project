const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = req.url || '';

  if (url === '/api/admin/auth' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try { body = JSON.parse(body); } catch (_) { body = {}; }
    const pw = String(body.password || '');
    const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
    const hash = crypto.createHash('sha256').update(pw).digest('hex');
    const expected = crypto.createHash('sha256').update(ADMIN_PW).digest('hex');
    if (hash !== expected) return res.status(401).json({ error: 'Неверный пароль' });
    return res.status(200).json({ ok: true, token: pw });
  }

  return res.status(404).json({ error: 'Not found: ' + url });
};
