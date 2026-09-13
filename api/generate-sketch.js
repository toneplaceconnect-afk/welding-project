// Serverless-функция Vercel: /api/generate-sketch
// POST { prompt, count, referenceImages }

const MASTER_PROMPT = `You create one photorealistic commercial photograph from a client's product brief.

SOURCE OF TRUTH
The CLIENT BRIEF is the only source of truth for the product. Understand the client's words literally and preserve the requested product, purpose, proportions, dimensions, materials, colors, finish, components and setting. Never replace the requested product with a visually similar object. Never borrow the identity of another object from examples, page templates or generic associations.

PRODUCT
Generate exactly ONE primary product: the product the client asked to make. Its silhouette must immediately communicate what it is. If the client asks for a table, it must visibly and unmistakably be a table: a tabletop supported from below by legs or a base, with realistic human scale and usable legroom. If the client asks for another product, use the same principle: make that exact product unmistakable and functionally coherent.

INTERPRETATION
Use sensible professional design judgment only where the client has left details unspecified. Do not invent requirements that change the product identity. Explicit client dimensions are authoritative; preserve their proportions and units. The image is a visualization of the client's requested object, not an opportunity to redesign the brief into another category.

REAL-WORLD CONSTRUCTION
The product must look physically manufacturable and structurally plausible. Use believable profiles, thicknesses, joints, welds, fasteners, supports, clearances and material behavior appropriate to the described construction. Every visible structural element must have a clear physical purpose. Avoid impossible intersections, floating parts, unsupported weight, distorted geometry and decorative structures that change the product category.

MATERIALS AND FINISH
Render the exact materials and finishes stated by the client. Metal should have physically believable thickness, edges, reflections, paint or powder coating and weld details. Wood should have natural grain, realistic texture, joints and scale. Keep the requested color and surface finish accurate.

PHOTOGRAPH
Produce a premium, realistic product photograph, not an illustration or technical presentation. Use natural physically plausible lighting, realistic shadows, accurate perspective, believable reflections, high material detail and a clean professional composition. Choose a three-quarter view when it best communicates the product. Show the complete product whenever practical. The requested product is the visual focus; the environment is secondary and exists only to establish context and scale.

VISUAL CLEANLINESS
No text, captions, labels, measurements, arrows, dimensions, logos, UI, diagrams, blueprints, CAD, wireframes, technical drawings, grids, collages, split screens, inset views or fantasy elements. Do not add a roof, overhead frame, walls, architectural enclosure or second designed product unless the client explicitly requests those elements as part of the product.

FINAL QUALITY CHECK
Before producing the image, verify internally: (1) Is this exactly the product the client requested? (2) Are all explicit requirements preserved? (3) Is the object physically believable and manufacturable? (4) Would a person identify the product correctly from its silhouette alone? If any answer is no, correct the concept before rendering.`;

function productGuard(brief) {
  const s = String(brief || '').toLowerCase();
  if (/\bстол\w*\b|обеден\w* стол|рабоч\w* стол|dining table|table/.test(s)) return `PRODUCT IDENTITY: TABLE. Create exactly one normal functional table. One continuous horizontal tabletop on top, supported only from below by a realistic base or legs. Normal human table height and proportions. Clear open space beneath for legs. Nothing rises above the tabletop as part of the table. No roof, canopy, pergola, gazebo, pavilion, shelter, walls, overhead beams, posts, screens or architectural frame. No second designed object.`;
  if (/пергол|pergola/.test(s)) return `PRODUCT IDENTITY: PERGOLA. Create exactly the outdoor pergola described by the client, with its requested posts, beams and roof elements. Do not turn it into furniture or a closed building.`;
  if (/беседк/.test(s)) return `PRODUCT IDENTITY: GAZEBO. Create exactly the gazebo described by the client, with a coherent supporting structure and roof.`;
  if (/навес|козыр/.test(s)) return `PRODUCT IDENTITY: CANOPY. Create exactly the requested canopy or awning with a clear supporting structure and roof plane.`;
  if (/забор|ворот|калит/.test(s)) return `PRODUCT IDENTITY: FENCE/GATE. Create exactly the requested boundary or entry construction with appropriate posts, panels and hardware.`;
  if (/лестниц|перил/.test(s)) return `PRODUCT IDENTITY: STAIR/RAILING. Create exactly the requested functional staircase or railing at realistic human scale.`;
  if (/мангал|барбекю|\bbbq\b/.test(s)) return `PRODUCT IDENTITY: BBQ/BRAZIER. Create exactly one recognizable, manufacturable barbecue or brazier requested by the client.`;
  if (/скамь|табурет|банкетк|\bbench\b|\bstool\b/.test(s)) return `PRODUCT IDENTITY: SEATING. Create exactly the requested bench, stool or seating product with a clear seat and support below.`;
  if (/стеллаж|полк|этажерк|\bshelf\b|\brack\b/.test(s)) return `PRODUCT IDENTITY: SHELVING. Create exactly one functional shelving/rack unit with storage surfaces supported by a frame.`;
  if (/стойк|ресепшн|барн\w* стойк|\bcounter\b/.test(s)) return `PRODUCT IDENTITY: COUNTER. Create exactly one functional counter/business stand with a clear working surface and support below.`;
  return `PRODUCT IDENTITY: Follow the client's exact product description. Create one recognizable functional product and do not substitute its category.`;
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
