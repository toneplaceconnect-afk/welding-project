const ADMIN_PW = process.env.ADMIN_PASSWORD || 'test';

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (request.method === 'OPTIONS') { response.status(204).end(); return; }
  if (request.method === 'POST') {
    const body = request.body || {};
    const pw = String(body.password || '');
    if (pw !== ADMIN_PW) { response.status(401).json({ error: 'wrong' }); return; }
    response.status(200).json({ ok: true, token: pw });
    return;
  }
  response.status(200).json({ ok: true, url: request.url });
}
