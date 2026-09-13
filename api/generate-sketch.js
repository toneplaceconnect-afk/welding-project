// Serverless-функция Vercel: /api/generate-sketch
// Two-stage pipeline: understand the client's object first, then render exactly one photo.

const DESIGN_ANALYST_PROMPT = `You are the design-analysis stage of a professional product visualization system.

Analyze the CLIENT BRIEF before any image is generated.

Your job is NOT to write marketing copy and NOT to invent a new design. Your job is to convert the client's natural-language request into a precise internal VISUAL DESIGN SPECIFICATION for an image generator.

Determine:
- the exact object or construction requested;
- its real-world category and primary function;
- its characteristic physical form and silhouette;
- the major components and how they are arranged;
- dimensions and proportions explicitly stated by the client;
- materials for each component;
- colors and surface finishes;
- construction and connection methods explicitly requested;
- intended environment and use;
- requested style;
- any other explicit visual requirement.

Use real-world design, engineering, furniture, architecture and manufacturing knowledge to understand what the described object should physically look like.

CRITICAL RULES:
1. The CLIENT BRIEF is the source of truth.
2. Do not replace the requested object with a familiar object that merely shares some words, materials or shapes.
3. Do not turn furniture into architecture, architecture into furniture, or one product category into another.
4. Do not invent features that change the object's identity, function, proportions or specified materials.
5. If information is missing, make only the minimum neutral assumption needed for a coherent, manufacturable object.
6. Preserve every explicit dimension, material, finish, component and connection.
7. Interpret spelling mistakes and informal language by intended meaning.
8. Check that the resulting concept could physically exist and be manufactured.
9. Do not add decorative elements merely because they are associated with a style word.

Return ONLY a concise VISUAL DESIGN SPECIFICATION that can be handed directly to a photorealistic image generator. Do not discuss your reasoning.`;

const IMAGE_MASTER_PROMPT = `You are an expert industrial designer, product designer, architect, engineer and professional commercial photographer.

Create ONE photorealistic commercial photograph of EXACTLY the object described in the VISUAL DESIGN SPECIFICATION.

The specification was produced by a separate design-analysis stage from the client's original request. Treat it as a construction and visualization specification, not as inspiration.

OBJECT IDENTITY
The requested object must be immediately recognizable from its physical form, silhouette and construction. Preserve its real-world category, function and proportions. Never substitute another object.

CLIENT FIDELITY
Preserve every explicit requirement represented in the specification: dimensions, proportions, materials, colors, finishes, components, construction details, connections, mechanisms, quantity, environment and style. Never silently omit or replace a requirement.

REAL-WORLD CONSTRUCTION
Build a physically plausible object. Every structural element must have a purpose. Supports must support. Components must connect logically. Joints and fasteners must be physically possible. Materials must have believable thickness, scale and behavior. Avoid floating parts, impossible intersections, disconnected elements, distorted geometry and unsupported structures.

MATERIAL REALISM
Render each specified material according to its real physical properties. Respect exact surface treatments. Do not apply generic black metal, generic orange wood, excessive gloss or arbitrary premium styling unless specified.

PHOTOGRAPHY
Create a finished high-end real photograph, not a drawing or concept illustration. Use realistic camera optics, perspective, lighting, reflections, shadows, depth of field and material detail. Choose the clearest professional camera angle and show the complete object and its important construction details. Keep the environment secondary.

STYLE
Express style through the actual geometry, proportions, materials and construction. Do not use style stereotypes that contradict the specification.

NO GRAPHIC ELEMENTS
No text, labels, captions, dimensions, arrows, logos, UI, diagrams, blueprints, CAD, wireframes, technical drawings, collages, split screens or inset views.

FINAL CHECK
Before rendering, verify that the image shows the exact requested object, that all specified characteristics are preserved, that its proportions and construction are physically believable, and that a real person could identify the object immediately from the photograph.

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
  const payload = { model: 'flux', prompt, size: '1024x768', n: 1, response_format: 'b64_json' };
  if (refs.length) payload.image = refs;
  const r = await fetch('https://gen.pollinations.ai/v1/images/generations', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return parseImageResponse(r);
}

async function fallback(prompt, apiKey) {
  const u = 'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt) + '?model=flux&width=1024&height=768&nologo=true';
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
      'VISUAL DESIGN SPECIFICATION:',
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