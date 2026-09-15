const crypto = require('crypto');

const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(ADMIN_PW).digest('hex');
const REPO = 'toneplaceconnect-afk/welding-project';
const BRANCH = 'main';
const CONTENT_PATH = 'content.json';
const ASSETS_DIR = 'assets/uploads';

function safeCompare(a, b) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return safeCompare(hash, ADMIN_PASSWORD_HASH);
}

async function githubGet(path, token) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
}

async function githubPut(path, content, message, token, sha) {
  const body = { message, content: Buffer.from(content, 'utf8').toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok;
}

async function githubUpload(filename, base64Data, token) {
  const path = `${ASSETS_DIR}/${filename}`;
  const existing = await githubGet(path, token);
  const body = { message: `Upload ${filename}`, content: base64Data, branch: BRANCH };
  if (existing) body.sha = existing.sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) return null;
  return `/${path}`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return res;
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch (_) { resolve({}); }
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();

  const path = (req.url || '').replace(/^\/api\/admin/, '');

  if (req.method === 'POST' && path === '/auth') {
    try {
      const body = await getBody(req);
      const password = String(body.password || '');
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (!safeCompare(hash, ADMIN_PASSWORD_HASH)) return cors(res).status(401).json({ error: 'Неверный пароль' });
      return cors(res).status(200).json({ ok: true, token: password });
    } catch (e) {
      return cors(res).status(500).json({ error: 'Auth error: ' + e.message });
    }
  }

  if (!checkAuth(req)) return cors(res).status(401).json({ error: 'Не авторизован' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return cors(res).status(500).json({ error: 'GITHUB_TOKEN не настроен в Vercel' });

  if (req.method === 'GET' && path === '/content') {
    const file = await githubGet(CONTENT_PATH, token);
    if (!file) return cors(res).status(404).json({ error: 'content.json не найден' });
    return cors(res).status(200).json({ content: JSON.parse(file.content), sha: file.sha });
  }

  if (req.method === 'POST' && path === '/save') {
    const body = await getBody(req);
    const { content, sha } = body;
    if (!content) return cors(res).status(400).json({ error: 'Пустой контент' });
    const jsonStr = JSON.stringify(content, null, 2);
    const ok = await githubPut(CONTENT_PATH, jsonStr, 'Update content.json via admin panel', token, sha);
    if (!ok) return cors(res).status(500).json({ error: 'Ошибка сохранения в GitHub' });
    return cors(res).status(200).json({ ok: true });
  }

  if (req.method === 'POST' && path === '/upload') {
    const body = await getBody(req);
    const { filename, data } = body;
    if (!filename || !data) return cors(res).status(400).json({ error: 'Нет файла' });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const uniqueName = `${Date.now()}-${safeName}`;
    const url = await githubUpload(uniqueName, data, token);
    if (!url) return cors(res).status(500).json({ error: 'Ошибка загрузки в GitHub' });
    return cors(res).status(200).json({ ok: true, url, filename: uniqueName });
  }

  return cors(res).status(404).json({ error: 'Not found' });
};
