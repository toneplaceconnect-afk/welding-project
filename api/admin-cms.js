const ADMIN_PW = process.env.ADMIN_PASSWORD || 'test';

export default async function handler(request, response) {
  try {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (request.method === 'OPTIONS') { response.status(204).end(); return; }

    const url = request.url || '';
    const body = request.body || {};

    if (url === '/api/admin-cms' && request.method === 'POST') {
      const pw = String(body.password || '');
      if (pw !== ADMIN_PW) { response.status(401).json({ error: 'wrong' }); return; }
      response.status(200).json({ ok: true, token: pw });
      return;
    }

    const auth = request.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== ADMIN_PW) { response.status(401).json({ error: 'unauth' }); return; }

    if (url === '/api/admin-cms/content' && request.method === 'GET') {
      response.status(200).json({ ok: true, step: 'content' });
      return;
    }

    if (url === '/api/admin-cms/save' && request.method === 'POST') {
      response.status(200).json({ ok: true, step: 'save' });
      return;
    }

    response.status(200).json({ ok: true, url: url });
  } catch (e) {
    response.status(500).json({ error: e.message });
  }
}
