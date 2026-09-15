const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'POST') {
    const pw = (req.body && req.body.password) || '';
    if (pw === ADMIN_PW) {
      res.status(200).json({ ok: true, token: pw });
    } else {
      res.status(401).json({ error: 'wrong password' });
    }
    return;
  }

  res.status(200).json({ ok: true, method: req.method, url: req.url });
}
