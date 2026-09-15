const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const REPO = 'toneplaceconnect-afk/welding-project';
const BRANCH = 'main';

function ok(res, data) { return res.status(200).json(data); }
function err(res, code, msg) { return res.status(code).json({ error: msg }); }
function ghAuth(token) { return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }; }
function cmsCors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); }

async function ghGet(path, token) {
  const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' } });
  if (!r.ok) return null;
  const d = await r.json();
  return { content: Buffer.from(d.content, 'base64').toString('utf8'), sha: d.sha };
}

async function ghPut(path, content, message, token, sha) {
  const body = { message: message, content: Buffer.from(content, 'utf8').toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, { method: 'PUT', headers: ghAuth(token), body: JSON.stringify(body) });
  return r.ok;
}

export default async function handler(request, response) {
  try {
    cmsCors(response);
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'OPTIONS') { response.status(204).end(); return; }

    const url = request.url || '';
    const body = request.body || {};

    if (url === '/api/admin-cms' && request.method === 'POST') {
      const pw = String(body.password || '');
      if (pw !== ADMIN_PW) return err(response, 401, 'Неверный пароль');
      return ok(response, { ok: true, token: pw });
    }

    const auth = request.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== ADMIN_PW) return err(response, 401, 'Не авторизован');

    const ghToken = process.env.GITHUB_TOKEN;
    if (!ghToken) return err(response, 500, 'GITHUB_TOKEN не настроен');

    if (url === '/api/admin-cms/content' && request.method === 'GET') {
      const file = await ghGet('content.json', ghToken);
      if (!file) return err(response, 404, 'content.json не найден');
      return ok(response, { content: JSON.parse(file.content), sha: file.sha });
    }

    if (url === '/api/admin-cms/save' && request.method === 'POST') {
      if (!body.content) return err(response, 400, 'Пустой контент');
      const saved = await ghPut('content.json', JSON.stringify(body.content, null, 2), 'Update content.json via admin', ghToken, body.sha);
      if (!saved) return err(response, 500, 'Ошибка сохранения');
      return ok(response, { ok: true });
    }

    if (url === '/api/admin-cms/upload' && request.method === 'POST') {
      if (!body.filename || !body.data) return err(response, 400, 'Нет файла');
      const safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const name = Date.now() + '-' + safe;
      const path = 'assets/uploads/' + name;
      const existing = await ghGet(path, ghToken);
      const gb = { message: 'Upload ' + name, content: body.data, branch: BRANCH };
      if (existing) gb.sha = existing.sha;
      const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, { method: 'PUT', headers: ghAuth(ghToken), body: JSON.stringify(gb) });
      if (!r.ok) return err(response, 500, 'Ошибка загрузки');
      return ok(response, { ok: true, url: '/' + path, filename: name });
    }

    return err(response, 404, 'Not found');
  } catch (e) {
    return err(response, 500, e.message);
  }
}
