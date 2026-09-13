// Serverless-функция Vercel: /api/generate-sketch
// Generates exactly one visualization from the client's brief.

const MASTER_PROMPT = `You are an expert industrial designer and professional commercial product photographer.

Create ONE photorealistic product photograph based strictly on the CLIENT BRIEF.

CLIENT BRIEF IS THE SOURCE OF TRUTH
Read the client's description literally. Identify exactly what the client wants to make. Preserve every explicit requirement: product type, function, dimensions, proportions, materials, colors, finish, components, quantity, location and style. Never replace the requested product with another category. Never use page examples, placeholders, previous requests or generic associations as requirements.

PRODUCT IDENTITY
The requested product must be immediately recognizable from its silhouette and physical construction. Create exactly one primary product. Do not transform a furniture item into architecture or an architectural item into furniture. Only include additional objects when they are ordinary environmental context and clearly secondary.

INTERPRETATION
Use professional design judgment only to fill genuinely unspecified details. Choose neutral, practical, manufacturable solutions. Never invent a feature that changes the product's category, function or proportions. Explicit dimensions are authoritative. Preserve dimensional relationships and realistic human scale.

MANUFACTURING REALISM
Make the object physically plausible and suitable for real fabrication. Use believable material thicknesses, profiles, plates, legs, supports, joints, welds, fasteners, clearances and load paths appropriate to the requested product. Every structural part must connect logically. Avoid floating elements, impossible intersections, distorted geometry and unsupported structures.

MATERIAL REALISM
Render the exact requested materials and finishes. Metal has realistic thickness, edges, reflections, coating and weld details. Wood has natural grain, believable scale, texture and joints. Preserve the client's specified color and surface finish.

PHOTOREALISTIC COMMERCIAL PHOTOGRAPHY
Create a premium real-world photograph, not a drawing or concept illustration. Use physically plausible natural or studio lighting, realistic shadows, accurate perspective, natural reflections, subtle depth of field, high-resolution material detail and believable camera optics. Compose the image so the entire requested product is easy to understand. Use a clean environment that supports the product without competing with it.

VISUAL RULES
No text, captions, labels, measurements, arrows, dimensions, logos, UI, diagrams, blueprints, CAD, wireframes, technical drawings, grids, collages, split screens or inset views. Do not add roofs, overhead structures, walls, architectural frames, shelters or unrelated designed objects unless the client explicitly requests them as part of the product.

FINAL VALIDATION
Before rendering, verify: the product category matches the client's words; every explicit requirement is preserved; dimensions and proportions are coherent; the construction is physically believable; and the result would be unmistakably identified as the requested product from the image alone. If not, correct the concept before rendering.`;

function productGuard(brief) {
  const s = String(brief || '').toLowerCase();
  if (/\bстол\w*\b|обеден\w* стол|рабоч\w* стол|dining table|table/.test(s)) return `The product identity is TABLE. Make exactly one normal functional table: one continuous horizontal tabletop, supported from below by legs or a base, normal human table height and proportions, clear open legroom beneath. No roof, canopy, pergola, gazebo, pavilion, shelter, walls, overhead beams, posts rising above the tabletop, screens or architectural frame. No second designed product.`;
  if (/пергол|pergola/.test(s)) return `The product identity is PERGOLA. Make exactly the outdoor pergola described by the client, with its requested posts, beams and roof elements. Do not convert it into furniture or a closed building.`;
  if (/беседк/.test(s)) return `The product identity is GAZEBO. Make exactly the gazebo described by the client, with its requested supporting structure and roof.`;
  if (/навес|козыр/.test(s)) return `The product identity is CANOPY. Make exactly the requested canopy or awning with its supporting structure and roof plane.`;
  if (/забор|ворот|калит/.test(s)) return `The product identity is FENCE/GATE. Make exactly the requested boundary or entry construction with appropriate posts, panels and hardware.`;
  if (/лестниц|перил/.test(s)) return `The product identity is STAIR/RAILING. Make exactly the requested functional staircase or railing at realistic human scale.`;
  if (/мангал|барбекю|\bbbq\b/.test(s)) return `The product identity is BBQ/BRAZIER. Make exactly one recognizable, manufacturable barbecue or brazier requested by the client.`;
  if (/скамь|табурет|банкетк|\bbench\b|\bstool\b/.test(s)) return `The product identity is SEATING. Make exactly the requested bench, stool or seating product with a clear seat and support below.`;
  if (/стеллаж|полк|этажерк|\bshelf\b|\brack\b/.test(s)) return `The product identity is SHELVING. Make exactly one functional shelving/rack unit with storage surfaces supported by a frame.`;
  if (/стойк|ресепшн|барн\w* стойк|\bcounter\b/.test(s)) return `The product identity is COUNTER. Make exactly one functional counter/business stand with a clear working surface and support below.`;
  return `The product identity must be taken directly from the client's description. Create exactly one recognizable functional product. Do not substitute its category.`;
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
    const prompt = [MASTER_PROMPT, productGuard(clientPrompt), 'CLIENT BRIEF — SOURCE OF TRUTH:', clientPrompt].join('\n\n');
    let image;
    try { image = await generate(prompt, refs, apiKey); }
    catch (e) { if (refs.length) image = await fallback(prompt, apiKey); else throw e; }
    return response.status(200).json({ images: [image], referenceCount: refs.length, identityLocked: true, count: 1 });
  } catch (err) {
    console.error('Pollinations error', err);
    return response.status(500).json({ error: 'Ошибка генерации: ' + (err?.message || String(err)) });
  }
}
