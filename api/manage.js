const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const REPO = 'toneplaceconnect-afk/welding-project';
const BRANCH = 'main';

function ok(res, data) { return res.status(200).json(data); }
function err(res, code, msg) { return res.status(code).json({ error: msg }); }

function ghHeaders(token) {
  return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
}

async function ghGet(path, token) {
  const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' } });
  if (!r.ok) return null;
  const d = await r.json();
  return { content: Buffer.from(d.content, 'base64').toString('utf8'), sha: d.sha };
}

async function ghPut(path, content, message, token, sha) {
  const body = { message: message, content: Buffer.from(content, 'utf8').toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, { method: 'PUT', headers: ghHeaders(token), body: JSON.stringify(body) });
  return r.ok;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    const url = req.url || '';
    const body = req.body || {};

    if (url === '/api/manage/auth' && req.method === 'POST') {
      const pw = String(body.password || '');
      if (pw !== ADMIN_PW) return err(res, 401, 'Неверный пароль');
      return ok(res, { ok: true, token: pw });
    }

    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== ADMIN_PW) return err(res, 401, 'Не авторизован');

    const ghToken = process.env.GITHUB_TOKEN;
    if (!ghToken) return err(res, 500, 'GITHUB_TOKEN не настроен');

    if (url === '/api/manage/content' && req.method === 'GET') {
      const file = await ghGet('content.json', ghToken);
      if (!file) return err(res, 404, 'content.json не найден');
      return ok(res, { content: JSON.parse(file.content), sha: file.sha });
    }

    if (url === '/api/manage/save' && req.method === 'POST') {
      if (!body.content) return err(res, 400, 'Пустой контент');
      const ok2 = await ghPut('content.json', JSON.stringify(body.content, null, 2), 'Update content.json via admin panel', ghToken, body.sha);
      if (!ok2) return err(res, 500, 'Ошибка сохранения в GitHub');
      return ok(res, { ok: true });
    }

    if (url === '/api/manage/upload' && req.method === 'POST') {
      if (!body.filename || !body.data) return err(res, 400, 'Нет файла');
      const safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const name = Date.now() + '-' + safe;
      const path = 'assets/uploads/' + name;
      const existing = await ghGet(path, ghToken);
      const gb = { message: 'Upload ' + name, content: body.data, branch: BRANCH };
      if (existing) gb.sha = existing.sha;
      const r = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, { method: 'PUT', headers: ghHeaders(ghToken), body: JSON.stringify(gb) });
      if (!r.ok) return err(res, 500, 'Ошибка загрузки');
      return ok(res, { ok: true, url: '/' + path, filename: name });
    }

    return err(res, 404, 'Not found');
  } catch (e) {
    return err(res, 500, e.message);
  }
}
