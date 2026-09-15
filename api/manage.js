const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    if (req.method === 'POST' && req.url === '/api/manage/auth') {
      const body = req.body || {};
      const pw = String(body.password || '');
      if (pw !== ADMIN_PW) { res.status(401).json({ error: 'Неверный пароль' }); return; }
      res.status(200).json({ ok: true, token: pw });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
