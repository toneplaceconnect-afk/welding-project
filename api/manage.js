const crypto = require('crypto');

const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(ADMIN_PW).digest('hex');
const REPO = 'toneplaceconnect-afk/welding-project';
const BRANCH = 'main';

function safeCompare(a, b) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method === 'POST' && req.url === '/api/manage/auth') {
    let raw = '';
    for await (const c of req) raw += c;
    let body = {};
    try { body = JSON.parse(raw); } catch(_) {}
    const pw = String(body.password || '');
    const hash = crypto.createHash('sha256').update(pw).digest('hex');
    if (!safeCompare(hash, ADMIN_PASSWORD_HASH)) { res.status(401).json({ error: 'Неверный пароль' }); return; }
    res.status(200).json({ ok: true, token: pw });
    return;
  }
  res.status(404).json({ error: 'Not found' });
};
