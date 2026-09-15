import { createHash, timingSafeEqual } from 'crypto';

const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const ADMIN_PASSWORD_HASH = createHash('sha256').update(ADMIN_PW).digest('hex');
const REPO = 'toneplaceconnect-afk/welding-project';
const BRANCH = 'main';
const CONTENT_PATH = 'content.json';
const ASSETS_DIR = 'assets/uploads';

function safeCompare(a, b) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function checkAuth(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const hash = createHash('sha256').update(token).digest('hex');
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

async function githubUpload(filename, buffer, token) {
  const path = `${ASSETS_DIR}/${filename}`;
  const existing = await githubGet(path, token);
  const body = {
    message: `Upload ${filename}`,
    content: buffer.toString('base64'),
    branch: BRANCH
  };
  if (existing) body.sha = existing.sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) return null;
  return `/${path}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }
  });
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return json({}, 204);

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/admin/, '');

  if (request.method === 'POST' && path === '/auth') {
    try {
      const body = await request.json().catch(() => ({}));
      const password = String(body.password || '');
      const hash = createHash('sha256').update(password).digest('hex');
      if (!safeCompare(hash, ADMIN_PASSWORD_HASH)) return json({ error: 'Неверный пароль' }, 401);
      return json({ ok: true, token: password });
    } catch (e) {
      return json({ error: 'Auth error: ' + e.message }, 500);
    }
  }

  if (!checkAuth(request)) return json({ error: 'Не авторизован' }, 401);

  const token = process.env.GITHUB_TOKEN;
  if (!token) return json({ error: 'GITHUB_TOKEN не настроен в Vercel' }, 500);

  if (request.method === 'GET' && path === '/content') {
    const file = await githubGet(CONTENT_PATH, token);
    if (!file) return json({ error: 'content.json не найден' }, 404);
    return json({ content: JSON.parse(file.content), sha: file.sha });
  }

  if (request.method === 'POST' && path === '/save') {
    const body = await request.json().catch(() => ({}));
    const { content, sha } = body;
    if (!content) return json({ error: 'Пустой контент' }, 400);
    const jsonStr = JSON.stringify(content, null, 2);
    const ok = await githubPut(CONTENT_PATH, jsonStr, 'Update content.json via admin panel', token, sha);
    if (!ok) return json({ error: 'Ошибка сохранения в GitHub' }, 500);
    return json({ ok: true });
  }

  if (request.method === 'POST' && path === '/upload') {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') return json({ error: 'Файл не загружен' }, 400);
    const ext = file.name.split('.').pop() || 'png';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const filename = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await githubUpload(filename, buffer, token);
    if (!url) return json({ error: 'Ошибка загрузки в GitHub' }, 500);
    return json({ ok: true, url, filename });
  }

  return json({ error: 'Not found' }, 404);
}
