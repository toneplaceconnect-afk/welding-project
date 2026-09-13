// Serverless-функция Vercel: /api/generate-sketch
// POST { prompt, count, referenceImages }

const MASTER_PROMPT = `You are a professional industrial designer and commercial product photographer.

TASK
Create a photorealistic photograph of the EXACT PRODUCT described in CLIENT BRIEF.
The product named by the client is the single source of truth for what must be generated.

1. PRODUCT IDENTITY
First determine what the client wants to make. Generate that object and only that object.
Never substitute the requested object with another familiar object.
If the client says TABLE, generate a TABLE.
If the client says PERGOLA, generate a PERGOLA.
If the client says SHELF, generate a SHELF.
The words in the client brief have priority over generic visual associations.

2. CLIENT REQUIREMENTS
Preserve every explicit requirement from the brief: product type, purpose, dimensions, proportions, materials, colors, finish, components, location and style.
Do not invent a different product, different dimensions or a different purpose.
When the brief gives dimensions, keep their relationship and scale realistic.
A component size is the size of that component, not the size of the entire product.

3. REAL CONSTRUCTION
Design the requested object as something a real professional workshop could manufacture.
Use believable profiles, tubes, plates, timber, joints, welds, fasteners and connections where appropriate.
Every part must have a physical reason to exist and must connect logically to the rest of the object.
Do not create impossible geometry, floating parts or decorative structural elements with no purpose.

4. PRODUCT RECOGNITION
The requested object must be immediately recognizable from its silhouette and construction.
Do not make the environment or additional objects more important than the requested product.
Additional furniture or scenery may appear only when useful for scale or context and must remain secondary.

5. MATERIALS
Render real materials: powder-coated or painted metal, realistic steel reflections, believable welds and edges, and natural wood with visible grain and realistic joints when specified.
Respect the exact material combination stated by the client.

6. PHOTOGRAPHY
Create a real-looking professional commercial photograph.
Natural realistic lighting, accurate perspective, balanced exposure, realistic shadows and reflections, believable depth of field, high physical detail.
Show the complete product whenever possible.
Choose the camera angle that makes the requested product easiest to understand.

7. IMAGE CONTENT
The image is a finished photograph, not a design presentation.
No text, labels, logos, captions, measurements, arrows, grids or interface elements.
No blueprint, CAD drawing, technical drawing, wireframe or sketch appearance.
No collage, split screen or inset images.
No fantasy architecture or unrelated objects.

FINAL RULE
Before rendering, mentally check: “Does the image clearly show the exact product requested by the client?”
If the answer is no, correct the concept before generating the image.`;

function productGuard(brief) {
  const s = String(brief || '').toLowerCase();

  if (/\bстол\w*\b|обеден\w* стол|рабоч\w* стол|dining table|table/.test(s)) {
    return `PRODUCT LOCK — TABLE
The requested product is ONE NORMAL TABLE.
Generate one clearly recognizable functional table.
It consists of a horizontal tabletop and a supporting base or legs below it.
The tabletop is the upper working surface. The base supports the tabletop from below.
There is normal open legroom below the tabletop.
The table has normal human scale and normal table proportions.
Nothing rises above the tabletop as part of the table.
Do not attach a roof, overhead beams, posts, walls, screens, shelves or architectural frame to the table.
Do not transform the table into a pergola, canopy, gazebo, pavilion, shelter, kiosk, platform or building.
Do not add a second designed product.
Chairs may be absent; if present, they are ordinary background furniture only and are not connected to the table.
The table itself must be the dominant and unmistakable object in the photograph.`;
  }

  if (/пергол|pergola/.test(s)) {
    return `PRODUCT LOCK — PERGOLA
Generate one open outdoor pergola with vertical posts, perimeter beams and an open roof made from the roof elements specified by the client.
Keep the lower area open and usable.
Do not turn it into a table, gazebo enclosure or closed building unless the client explicitly requests that.`;
  }

  if (/беседк/.test(s)) {
    return `PRODUCT LOCK — GAZEBO
Generate one real outdoor gazebo according to the client's description.
Preserve its posts, supports and roof and keep the construction physically coherent.`;
  }

  if (/навес|козыр/.test(s)) {
    return `PRODUCT LOCK — CANOPY
Generate one real functional canopy or awning according to the client's description.
It must have a clear supporting structure and a clear canopy/roof plane.`;
  }

  if (/забор|ворот|калит/.test(s)) {
    return `PRODUCT LOCK — FENCE / GATE
Generate the requested boundary or entry structure as a real installable product.
Keep posts, panels, hinges and supports appropriate to the requested type.`;
  }

  if (/лестниц|перил/.test(s)) {
    return `PRODUCT LOCK — STAIR / RAILING
Generate the requested staircase or railing as a real functional construction with correct human scale and believable supports.`;
  }

  if (/мангал|барбекю|\bbbq\b/.test(s)) {
    return `PRODUCT LOCK — BBQ
Generate one recognizable, manufacturable barbecue, brazier or BBQ zone exactly as requested.`;
  }

  if (/скамь|табурет|банкетк|\bbench\b|\bstool\b/.test(s)) {
    return `PRODUCT LOCK — SEATING
Generate one recognizable functional bench, stool or other requested seating product.
It must have a clear seat and supporting structure below it.`;
  }

  if (/стеллаж|полк|этажерк|\bshelf\b|\brack\b/.test(s)) {
    return `PRODUCT LOCK — SHELVING
Generate one recognizable functional shelving or rack unit.
Shelves are horizontal storage surfaces supported by a frame or supports.
Do not turn the shelving into a building frame or architectural structure.`;
  }

  if (/стойк|ресепшн|барн\w* стойк|\bcounter\b/.test(s)) {
    return `PRODUCT LOCK — COUNTER
Generate one recognizable functional counter or business stand with a clear working surface and support below.`;
  }

  return `PRODUCT LOCK
Generate exactly the product described by the client. Keep its identity obvious, functional and physically manufacturable.`;
}

const VIEWS = [
  `VIEW 1 — MASTER IMAGE
Show the complete requested product as one finished physical object in a realistic environment.
Use a strong three-quarter camera angle that clearly reveals the object's actual form and construction.
This image establishes the canonical design for all following images.`,
  `VIEW 2 — SAME PRODUCT
Re-photograph the exact same physical product established in VIEW 1.
Do not redesign it. Keep every component, proportion, material, color and connection identical.
Only the camera position, visible side, crop and lighting may change.`,
  `VIEW 3 — SAME PRODUCT
Show the exact same physical product from another useful professional camera angle.
Do not add, remove or redesign any component. Only camera position and composition may change.`,
  `VIEW 4 — SAME PRODUCT
Show the exact same physical product in a clean functional view.
Do not redesign it or introduce new structural elements.`
];

function dataUrlToBlob(dataUrl, index) {
  const m = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!m) throw Error('Некорректный формат изображения №' + (index + 1));
  return new Blob([Buffer.from(m[2], 'base64')], { type: m[1] || 'image/jpeg' });
}

async function uploadImage(dataUrl, index, apiKey) {
  const blob = dataUrlToBlob(dataUrl, index);
  const form = new FormData();
  form.append('file', blob, 'reference-' + (index + 1) + '.jpg');
  const r = await fetch('https://gen.pollinations.ai/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey },
    body: form
  });
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
  const payload = {
    model: 'flux',
    prompt,
    size: '1024x768',
    n: 1,
    response_format: 'b64_json'
  };
  if (refs.length) payload.image = refs;
  const r = await fetch('https://gen.pollinations.ai/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseImageResponse(r);
}

async function editCanonical(dataUrl, prompt, apiKey) {
  const blob = dataUrlToBlob(dataUrl, 0);
  const form = new FormData();
  form.append('image', blob, 'canonical.png');
  form.append('prompt', prompt);
  form.append('model', 'kontext');
  form.append('size', '1024x768');
  const r = await fetch('https://gen.pollinations.ai/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey },
    body: form
  });
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
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const clientPrompt = String(body.prompt || '').trim();
  const count = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 4);
  const inputs = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 5) : [];

  if (!clientPrompt) return response.status(400).json({ error: 'Пустой запрос (prompt).' });

  try {
    const refs = inputs.length ? await Promise.all(inputs.map((x, i) => uploadImage(x, i, apiKey))) : [];
    const guard = productGuard(clientPrompt);

    const makePrompt = i => [
      MASTER_PROMPT,
      guard,
      'CLIENT BRIEF — THIS IS THE SOURCE OF TRUTH:',
      clientPrompt,
      VIEWS[i],
      'FINAL CHECK: Generate the exact requested product, not a visually similar product. Do not invent architectural structures, roofs, overhead frames or additional products unless the client explicitly requested them.'
    ].join('\n\n');

    let first;
    try {
      first = await generate(makePrompt(0), refs, apiKey);
    } catch (e) {
      if (refs.length) first = await fallback(makePrompt(0), apiKey);
      else throw e;
    }

    const images = [first];

    for (let i = 1; i < count; i++) {
      let image;
      try {
        image = await editCanonical(first, makePrompt(i), apiKey);
      } catch (editError) {
        console.warn('Canonical edit failed:', editError?.message || editError);
        let canonicalUrl = null;
        try { canonicalUrl = await uploadImage(first, 0, apiKey); } catch (uploadError) {
          console.warn('Canonical upload failed:', uploadError?.message || uploadError);
        }
        if (canonicalUrl) {
          image = await generate(
            makePrompt(i) + '\n\nThe attached image is the canonical product. Reproduce that exact object. Change only camera and composition.',
            [canonicalUrl],
            apiKey
          );
        } else {
          image = await fallback(makePrompt(i) + '\n\nReproduce the same exact physical product; do not redesign it.', apiKey);
        }
      }
      images.push(image);
    }

    return response.status(200).json({
      images,
      referenceCount: refs.length,
      identityLocked: true,
      viewMode: 'canonical-edit'
    });
  } catch (err) {
    console.error('Pollinations error', err);
    return response.status(500).json({ error: 'Ошибка генерации: ' + (err?.message || String(err)) });
  }
}
