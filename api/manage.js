const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  try {
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
      const hash = await sha256(pw);
      const expected = await sha256(ADMIN_PW);
      if (hash !== expected) { res.status(401).json({ error: 'Неверный пароль' }); return; }
      res.status(200).json({ ok: true, token: pw });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
