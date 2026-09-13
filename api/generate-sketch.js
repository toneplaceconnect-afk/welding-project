// Serverless-функция Vercel: /api/generate-sketch
// Two-stage pipeline: understand the client's object first, then render exactly one photo.

const DESIGN_ANALYST_PROMPT = `You are the semantic design-analysis stage of a professional product visualization system.

Convert the CLIENT BRIEF into a compact, unambiguous VISUAL DESIGN SPECIFICATION for an image generator. Do not create marketing copy and do not redesign the requested object.

Return ONLY these fields, in this exact order:
OBJECT CATEGORY: [the real-world object/product/construction]
PRIMARY FUNCTION: [what it is used for]
FORM AND SILHOUETTE: [the characteristic physical form; state what must be visibly recognizable]
COMPONENTS AND ARRANGEMENT: [major parts and how they connect]
DIMENSIONS AND PROPORTIONS: [all explicit dimensions; do not invent dimensions]
MATERIALS: [material assigned to each major part]
COLORS AND FINISHES: [explicit colors, coatings, surface treatments]
CONSTRUCTION AND CONNECTIONS: [explicit joints, fasteners, mechanisms and manufacturing details]
ENVIRONMENT AND USE: [where/how it is used]
STYLE: [requested visual style]

Rules:
1. The CLIENT BRIEF is the source of truth.
2. OBJECT CATEGORY is a hard identity constraint. Never replace it with another familiar object.
3. Preserve every explicit dimension, material, finish, component, connection and functional requirement.
4. Interpret spelling mistakes, typos and informal wording by intended meaning.
5. Use real-world engineering, furniture, manufacturing and design knowledge only to understand the brief and make the minimum neutral assumptions needed for a coherent manufacturable object.
6. Never add a feature merely because it is associated with a style word.
7. If a detail is not specified, write "not specified" rather than inventing a distinctive feature.
8. Keep the specification concise. Do not explain your reasoning.`;

const IMAGE_MASTER_PROMPT = `You are an expert industrial designer, furniture/product designer, engineer and professional commercial photographer.

TASK
Create ONE photorealistic commercial photograph of the exact object defined by the VISUAL DESIGN SPECIFICATION.

HARD IDENTITY RULE
The value after "OBJECT CATEGORY:" is the identity of the image. It is a hard constraint, not a suggestion. The finished image must be immediately recognizable as that exact real-world object and must not become a different product, device, structure, enclosure, sculpture or generic object.

FIDELITY
Preserve every explicit requirement in the specification and original brief: object category, function, dimensions, proportions, components, materials, colors, finishes, construction, joints, fasteners, mechanisms, environment and requested style. Do not omit a requirement just because it is visually subtle.

PHYSICAL CONSTRUCTION
Build one coherent, manufacturable object. Structural members must support the load they are meant to carry. Every visible component must have a logical location and connection. Use believable thickness, scale, joinery and fasteners. No floating parts, impossible intersections, disconnected components or physically contradictory geometry.

MATERIAL REALISM
Render each specified material according to its real physical properties. Preserve specified wood species, grain direction, metal type/color, coatings and surface treatment. Do not turn unspecified metal black or invent a glossy/plastic finish.

VISUAL PRIORITY
Prioritize the requested object's recognizable silhouette and component arrangement first, then construction details, then materials and finish. A clear three-quarter product photograph is preferred when it shows the whole object and important construction details without hiding them.

PHOTOGRAPHY
High-end real commercial photograph, realistic camera optics, perspective, natural material texture, believable reflections and shadows, physically plausible lighting, realistic depth of field. The environment is secondary and must never change the object's identity.

NO GRAPHICS
No text, labels, captions, dimensions, arrows, logos, UI, diagrams, blueprints, CAD, wireframes, technical drawings, collages, split screens or inset views.

FINAL INTERNAL CHECK
Before rendering, verify: (1) the object category exactly matches the specification; (2) the silhouette and function match; (3) every explicit material and major component is present; (4) the construction is physically possible; (5) no unrelated object has been substituted.

Generate exactly ONE image.`;

async function analyzeBrief(clientBrief, apiKey) {
  const r = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.6-luna',
      temperature: 0.1,
      messages: [
        { role: 'system', content: DESIGN_ANALYST_PROMPT },
        { role: 'user', content: 'CLIENT BRIEF:\n' + clientBrief }
      ]
    })
  });
  if (!r.ok) throw Error('Design analysis ' + r.status + ': ' + (await r.text()).slice(0, 600));
  const d = await r.json();
  const text = d?.choices?.[0]?.message?.content;
  if (!text) throw Error('Design analysis did not return a specification.');
  return String(text).trim();
}

function dataUrlToBlob(dataUrl, index) {
  const m = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!m) throw Error('Некорректный формат изображения №' + (index + 1));
  return new Blob([Buffer.from(m[2], 'base64')], { type: m[1] || 'image/jpeg' });
}

async function uploadImage(dataUrl, index, apiKey) {
  const blob = dataUrlToBlob(dataUrl, index);
  const form = new FormData();
  form.append('file', blob, 'reference-' + (index + 1) + '.jpg');
  const r = await fetch('https://gen.pollinations.ai/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey }, body: form });
  if (!r.ok) throw Error('Не удалось загрузить изображение №' + (index + 1) + ': ' + (await r.text()).slice(0, 400));
  const d = await r.json();
  if (!d.url) throw Error('Pollinations не вернул URL изображения №' + (index + 1));
  return d.url;
}

async function parseImageResponse(r) {
  if (!r.ok) throw Error('Pollinations ' + r.status + ': ' + (await r.text()).slice(0, 600));
  const d = await r.json();
  const item = d?.data?.[0];
  if (!item) throw Error('Pollinations не вернул изображение.');
  if (item.b64_json) return 'data:image/png;base64,' + item.b64_json;
  if (item.url) return item.url;
  throw Error('Pollinations вернул неизвестный формат изображения.');
}

async function generate(prompt, refs, apiKey) {
  const payload = { model: 'gpt-image-2', prompt, size: '1024x768', n: 1, response_format: 'b64_json' };
  if (refs.length) payload.image = refs;
  const r = await fetch('https://gen.pollinations.ai/v1/images/generations', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return parseImageResponse(r);
}

async function fallback(prompt, apiKey) {
  const u = 'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt) + '?model=gpt-image-2&width=1024&height=768&nologo=true';
  const r = await fetch(u, { headers: { Authorization: 'Bearer ' + apiKey } });
  if (!r.ok) throw Error('Pollinations ' + r.status + ': ' + (await r.text()).slice(0, 500));
  const type = (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
  return 'data:' + type + ';base64,' + Buffer.from(await r.arrayBuffer()).toString('base64');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return response.status(500).json({ error: 'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.' });
  let body = request.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};
  const clientPrompt = String(body.prompt || '').trim();
  const inputs = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 5) : [];
  if (!clientPrompt) return response.status(400).json({ error: 'Пустой запрос (prompt).' });
  try {
    const refs = inputs.length ? await Promise.all(inputs.map((x, i) => uploadImage(x, i, apiKey))) : [];
    let visualSpec;
    try {
      visualSpec = await analyzeBrief(clientPrompt, apiKey);
    } catch (analysisError) {
      console.warn('Design analysis unavailable, using original brief:', analysisError?.message || analysisError);
      visualSpec = clientPrompt;
    }
    const prompt = [
      IMAGE_MASTER_PROMPT,
      'VISUAL DESIGN SPECIFICATION — HARD CONSTRAINTS:',
      visualSpec,
      'ORIGINAL CLIENT BRIEF — FINAL AUTHORITY:',
      clientPrompt
    ].join('\n\n');
    let image;
    try { image = await generate(prompt, refs, apiKey); }
    catch (e) { if (refs.length) image = await fallback(prompt, apiKey); else throw e; }
    return response.status(200).json({ images: [image], referenceCount: refs.length, count: 1, analyzed: visualSpec !== clientPrompt });
  } catch (err) {
    console.error('Pollinations error', err);
    return response.status(500).json({ error: 'Ошибка генерации: ' + (err?.message || String(err)) });
  }
}
