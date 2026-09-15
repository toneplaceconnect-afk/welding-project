// Vercel serverless function: /api/generate-sketch
// Image pipeline: Cloudflare Workers AI + FLUX.2 dev.
// One semantic analysis call + exactly one image generation call. No automatic retries.

const DESIGN_ANALYST_PROMPT = `You are the semantic design-analysis stage of a professional product visualization system.

Read the CLIENT BRIEF and return a concise English VISUAL DESIGN SPECIFICATION for an image generator.

Rules:
1. The client's requested object is the absolute identity of the image. Never replace it with another familiar object.
2. Preserve every explicit dimension, proportion, material, color, finish, component, joint, fastener, function and use condition.
3. Interpret spelling mistakes and informal Russian wording by intended meaning.
4. Do not invent distinctive features. If something is unspecified, keep it neutral.
5. Use practical furniture/manufacturing knowledge only to make the minimum neutral assumptions needed for a coherent, physically buildable object.
6. The result must be in English because it will be passed to the image model.
7. Do not write marketing copy, explanations or alternatives.

Return ONLY a compact specification in this exact format:
OBJECT: ...
FUNCTION: ...
FORM: ...
COMPONENTS: ...
DIMENSIONS: ...
MATERIALS: ...
COLORS AND FINISHES: ...
CONSTRUCTION: ...
ENVIRONMENT: ...
STYLE: ...`;

const IMAGE_PROMPT_PREFIX = `Create ONE photorealistic commercial product photograph of the exact object described below.

OBJECT IDENTITY IS HARD: the object named after OBJECT: must remain exactly that object. Do not substitute a different product, machine, enclosure, sculpture, abstract form or generic object.

Preserve every explicit requirement. The visible silhouette, function, major components and proportions have priority. All specified materials, wood species, grain direction, metal color, coatings, fasteners and construction details must be visibly plausible. Use physically realistic scale, joinery and load-bearing structure.

Show the whole object clearly in a professional three-quarter product view. Real camera optics, realistic perspective, natural material texture, believable reflections and shadows, high exposure, clean premium environment, shallow-to-moderate depth of field. The environment must remain secondary to the object.

NO text, labels, dimensions, arrows, logos, UI, diagrams, blueprints, CAD, wireframes, collage, split screen or inset views. ONE object, ONE photograph.

FINAL CHECK before rendering: object identity, silhouette, function, explicit materials, major components and construction must all match the specification.`;

function dataUrlToBlob(dataUrl, index) {
  const m = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!m) throw Error('Некорректный формат изображения №' + (index + 1));
  return new Blob([Buffer.from(m[2], 'base64')], { type: m[1] || 'image/png' });
}

async function analyzeBrief(clientBrief, accountId, token) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/qwen/qwen3-30b-a3b-fp8`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: DESIGN_ANALYST_PROMPT },
        { role: 'user', content: 'CLIENT BRIEF:\n' + clientBrief }
      ],
      temperature: 0.1,
      max_tokens: 900
    })
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => '');
    throw Error('Сервис анализа временно недоступен (HTTP ' + r.status + '). ' + errBody.slice(0, 200));
  }
  const d = await r.json();
  const text = d?.result?.response || d?.result?.choices?.[0]?.message?.content || d?.choices?.[0]?.message?.content;
  if (!text) throw Error('Cloudflare semantic analysis did not return a specification.');
  return String(text).trim();
}

async function generateImage(prompt, refs, accountId, token) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('steps', '25');
  form.append('guidance', '6');
  form.append('width', '1024');
  form.append('height', '768');

  refs.slice(0, 2).forEach((dataUrl, index) => {
    form.append('input_image_' + index, dataUrlToBlob(dataUrl, index), 'reference-' + (index + 1) + '.png');
  });

  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/black-forest-labs/flux-2-dev`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form
  });

  if (!r.ok) {
    const errBody = await r.text().catch(() => '');
    if (r.status === 403 || r.status === 429) {
      throw Error('Сервис генерации временно недоступен (HTTP ' + r.status + '). Проверьте дневной лимит и попробуйте позже.');
    }
    throw Error('Сервис генерации временно недоступен (HTTP ' + r.status + '). ' + errBody.slice(0, 200));
  }

  const d = await r.json();
  const image = d?.result?.image;
  if (!image) throw Error('Cloudflare не вернул изображение.');
  return 'data:image/jpeg;base64,' + image;
}

const ADMIN_PW = process.env.ADMIN_PASSWORD || 'proekt-svarka-2024';
const CMS_REPO = 'toneplaceconnect-afk/welding-project';
const CMS_BRANCH = 'main';

function cmsOk(res, data) { return res.status(200).json(data); }
function cmsErr(res, code, msg) { return res.status(code).json({ error: msg }); }
function cmsHeaders(token) { return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }; }
async function cmsGhGet(path, token) {
  const r = await fetch('https://api.github.com/repos/' + CMS_REPO + '/contents/' + path + '?ref=' + CMS_BRANCH, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' } });
  if (!r.ok) return null;
  const d = await r.json();
  return { content: Buffer.from(d.content, 'base64').toString('utf8'), sha: d.sha };
}
async function cmsGhPut(path, content, message, token, sha) {
  const body = { message: message, content: Buffer.from(content, 'utf8').toString('base64'), branch: CMS_BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch('https://api.github.com/repos/' + CMS_REPO + '/contents/' + path, { method: 'PUT', headers: cmsHeaders(token), body: JSON.stringify(body) });
  return r.ok;
}

function cmsCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export default async function handler(request, response) {
  cmsCors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();

  const url = request.url || '';
  const body = request.body || {};

  if (url.includes('/admin/auth') && request.method === 'POST') {
    const pw = String(body.password || '');
    if (pw !== ADMIN_PW) return cmsErr(response, 401, 'Неверный пароль');
    return cmsOk(response, { ok: true, token: pw });
  }

  if (url.includes('/admin/')) {
    const auth = request.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== ADMIN_PW) return cmsErr(response, 401, 'Не авторизован');
    const ghToken = process.env.GITHUB_TOKEN;
    if (!ghToken) return cmsErr(response, 500, 'GITHUB_TOKEN не настроен');

    if (url.includes('/admin/content') && request.method === 'GET') {
      const file = await cmsGhGet('content.json', ghToken);
      if (!file) return cmsErr(response, 404, 'content.json не найден');
      return cmsOk(response, { content: JSON.parse(file.content), sha: file.sha });
    }
    if (url.includes('/admin/save') && request.method === 'POST') {
      if (!body.content) return cmsErr(response, 400, 'Пустой контент');
      const saved = await cmsGhPut('content.json', JSON.stringify(body.content, null, 2), 'Update content.json via admin', ghToken, body.sha);
      if (!saved) return cmsErr(response, 500, 'Ошибка сохранения в GitHub');
      return cmsOk(response, { ok: true });
    }
    if (url.includes('/admin/upload') && request.method === 'POST') {
      if (!body.filename || !body.data) return cmsErr(response, 400, 'Нет файла');
      const safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const name = Date.now() + '-' + safe;
      const path = 'assets/uploads/' + name;
      const existing = await cmsGhGet(path, ghToken);
      const gb = { message: 'Upload ' + name, content: body.data, branch: CMS_BRANCH };
      if (existing) gb.sha = existing.sha;
      const r = await fetch('https://api.github.com/repos/' + CMS_REPO + '/contents/' + path, { method: 'PUT', headers: cmsHeaders(ghToken), body: JSON.stringify(gb) });
      if (!r.ok) return cmsErr(response, 500, 'Ошибка загрузки');
      return cmsOk(response, { ok: true, url: '/' + path, filename: name });
    }
    return cmsErr(response, 404, 'Not found');
  }

  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    return response.status(500).json({
      error: 'Не настроен Cloudflare Workers AI. Нужны переменные CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN в Vercel.'
    });
  }

  let body = request.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const clientPrompt = String(body.prompt || '').trim();
  const refs = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 2) : [];
  if (!clientPrompt) return response.status(400).json({ error: 'Пустой запрос (prompt).' });
  if (clientPrompt.length > 3000) return response.status(400).json({ error: 'Описание слишком длинное. Максимум 3000 символов.' });
  if (refs.length > 2) return response.status(400).json({ error: 'Максимум 2 изображения.' });

  try {
    let visualSpec = clientPrompt;
    let analyzed = false;

    try {
      visualSpec = await analyzeBrief(clientPrompt, accountId, token);
      analyzed = true;
    } catch (analysisError) {
      // Do not spend a second paid/free image request on a retry. The original brief is a safe fallback.
      console.warn('Cloudflare semantic analysis unavailable; using original brief:', analysisError?.message || analysisError);
    }

    const prompt = [
      IMAGE_PROMPT_PREFIX,
      'VISUAL DESIGN SPECIFICATION:',
      visualSpec,
      'ORIGINAL CLIENT BRIEF — FINAL AUTHORITY:',
      clientPrompt
    ].join('\n\n');

    const image = await generateImage(prompt, refs, accountId, token);
    return response.status(200).json({ images: [image], referenceCount: refs.length, count: 1, analyzed });
  } catch (err) {
    console.error('Cloudflare Workers AI error', err);
    return response.status(500).json({ error: 'Ошибка генерации: ' + (err?.message || String(err)) });
  }
}
