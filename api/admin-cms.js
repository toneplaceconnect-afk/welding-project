const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }

  if (request.url === '/api/admin-cms' && request.method === 'POST') {
    const body = request.body || {};
    const pw = String(body.password || '');
    if (pw !== ADMIN_PW) { response.status(401).json({ error: 'Неверный пароль' }); return; }
    response.status(200).json({ ok: true, token: pw });
    return;
  }

  response.status(200).json({ ok: true, url: request.url });
}
