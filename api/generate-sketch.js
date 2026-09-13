// Serverless-функция Vercel: /api/generate-sketch
// Принимает POST { prompt, count, referenceImages } и генерирует изображения через Pollinations.
// Ключ хранится только в переменных окружения Vercel.

const MASTER_PROMPT = `
You are an expert industrial designer, furniture designer, welding engineer and professional commercial photographer specializing in custom metalwork and metal-and-wood products.

Create a highly photorealistic commercial photograph from the CLIENT BRIEF.

HIGHEST PRIORITY — PRODUCT IDENTITY:
The named product category is absolute. Create exactly that product. A furniture item must remain furniture; an architectural item must remain an architectural item. Never reinterpret a table, bench, shelf, counter or other furniture as a canopy, pergola, gazebo, pavilion, building frame, fence or other large structure.

The client brief is the source of truth. Preserve every explicitly specified characteristic: product type, purpose, overall dimensions, component dimensions, proportions, materials, cross-sections, profiles, colors, style, quantity, installation location and special requirements.

COMPONENT-BASED CONSTRUCTION:
Treat the product as an assembly of separate physical components. Component descriptions have priority over vague global material descriptions.
For every component, distinguish between:
- component overall dimensions;
- material element type (board, timber beam, square tube, rectangular tube, angle, plate, etc.);
- material cross-section/thickness;
- component length/width/height;
- quantity;
- orientation and position;
- relationship to other components.

CRITICAL UNIT RULE:
A dimension such as 100x150 mm attached to a timber beam means the beam cross-section is 100x150 mm, NOT that the tabletop is 100x150 mm. A dimension such as 150x150 mm attached to a timber beam means beam cross-section 150x150 mm. Preserve this distinction exactly.

If overall product dimensions and component cross-sections are both provided, do not confuse them. Use the overall dimensions for the finished product and the component dimensions for the physical pieces.

CONSTRUCTION LOGIC:
The object must look manufacturable by a professional workshop. Respect realistic structural logic, profile-tube dimensions, load-bearing supports, welds, fasteners where appropriate, realistic metal thickness, joinery and wood-to-metal relationships. Do not invent large structural frames or extra supports merely because the style is industrial/loft.

REFERENCE IMAGES:
If references are supplied, use them as visual references for site geometry, existing architecture, materials, proportions, silhouette and design cues. Do not copy unrelated objects. Keep the requested product identity and component structure dominant.

MATERIAL REALISM:
Show realistic powder-coated or painted steel, believable reflections, welded seams, cut edges and joints. Show natural wood grain, pores, edges, end grain and realistic finishing. Different materials must react correctly to light.

COMPOSITION:
For furniture, the furniture must be unmistakable and occupy approximately 70–80% of the image. Show the complete object from floor to top when an overall view is requested. Keep enough environment to explain scale and use. Never let the environment become the main subject.

PHOTOGRAPHY:
Professional full-frame commercial product/interior photography. Natural realistic light, balanced exposure, soft directional shadows, accurate reflections, HDR, realistic ambient occlusion, natural white balance and believable 35mm/50mm/85mm perspective.

PHOTOREALISM:
The result must look like a genuine photograph taken on location, not an illustration or generic 3D render. Prioritize geometry, construction, materials, scale, perspective and photographic micro-detail.

ABSOLUTE NEGATIVES:
No abstract art. No concept-art look. No CGI plastic. No collage. No split screen. No inset images. No exploded view. No blueprint overlay. No labels. No captions. No text. No logos. No watermark. No UI. No fantasy architecture. No canopy. No pergola. No gazebo. No pavilion. No building frame when the requested product is furniture. No impossible joints. No floating parts. No warped geometry. No extra legs, shelves, handles, roofs, walls or supports not present in the brief.
`;

const VIEW_INSTRUCTIONS = [
  `VIEW A — HERO PHOTOGRAPH. Show exactly one finished product from a strong three-quarter front perspective at human eye level. The product is the dominant subject. Make its complete silhouette, component structure, proportions, materials and intended function immediately readable.`,
  `VIEW B — SAME PRODUCT, DIFFERENT CAMERA. Show the exact same physical product with exactly the same components, dimensions, materials, colors and construction. Move the camera substantially to the side/diagonal to reveal depth, cross-sections, supports, joints and connections. Do not redesign the product.`,
  `VIEW C — CONSTRUCTION DETAIL. Show a close professional photograph of the most important component connection or material detail while keeping enough context to identify the exact product.`,
  `VIEW D — FUNCTIONAL SIDE VIEW. Show the same exact product from a clean side or slightly elevated angle that makes dimensions, depth and functional construction clear.`
];

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  return new Blob([bytes], { type: match[1] || 'image/jpeg' });
}

async function uploadReference(dataUrl, index, apiKey) {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) throw new Error('Некорректный формат референса №' + (index + 1));
  const form = new FormData();
  form.append('file', blob, 'reference-' + (index + 1) + '.jpg');
  const uploadResponse = await fetch('https://gen.pollinations.ai/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey },
    body: form
  });
  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error('Не удалось загрузить референс №' + (index + 1) + ': ' + text.slice(0, 400));
  }
  const data = await uploadResponse.json();
  if (!data.url) throw new Error('Pollinations не вернул URL референса №' + (index + 1));
  return data.url;
}

async function generateWithReferences(prompt, model, referenceUrls, apiKey) {
  const payload = { model, prompt, size: '1024x768', n: 1, response_format: 'b64_json' };
  if (referenceUrls.length) payload.image = referenceUrls;
  const aiResponse = await fetch('https://gen.pollinations.ai/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error('Pollinations ' + aiResponse.status + ': ' + errorText.slice(0, 500));
  }
  const data = await aiResponse.json();
  const item = data && data.data && data.data[0];
  if (!item) throw new Error('Pollinations не вернул изображение.');
  if (item.b64_json) return 'data:image/png;base64,' + item.b64_json;
  if (item.url) return item.url;
  throw new Error('Pollinations вернул неизвестный формат изображения.');
}

async function generateFallback(prompt, apiKey) {
  const url = 'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt) + '?model=flux&width=1024&height=768&nologo=true';
  const aiResponse = await fetch(url, { method: 'GET', headers: { Authorization: 'Bearer ' + apiKey } });
  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error('Pollinations ' + aiResponse.status + ': ' + errorText.slice(0, 500));
  }
  const contentType = aiResponse.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await aiResponse.arrayBuffer());
  return 'data:' + contentType.split(';')[0] + ';base64,' + buffer.toString('base64');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return response.status(500).json({ error: 'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.' });

  let body = request.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const clientPrompt = String(body.prompt || '').trim();
  const count = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 4);
  const inputReferences = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 5) : [];
  if (!clientPrompt) return response.status(400).json({ error: 'Пустой запрос (prompt).' });

  try {
    let referenceUrls = [];
    if (inputReferences.length) referenceUrls = await Promise.all(inputReferences.map((img, i) => uploadReference(img, i, apiKey)));

    const requests = Array.from({ length: count }, async (_, index) => {
      const fullPrompt = MASTER_PROMPT +
        '\n\nCLIENT BRIEF / STRUCTURED PRODUCT:\n' + clientPrompt +
        '\n\n' + VIEW_INSTRUCTIONS[index % VIEW_INSTRUCTIONS.length] +
        '\n\nIDENTITY LOCK: This is the same exact physical product across all requested views. Preserve every component and its dimensions. Only camera position, crop and photographic composition change.';
      try {
        return await generateWithReferences(fullPrompt, 'flux', referenceUrls, apiKey);
      } catch (primaryError) {
        if (referenceUrls.length) {
          console.warn('Reference generation failed, using text fallback:', primaryError);
          return await generateFallback(fullPrompt + '\nReference images were supplied but could not be attached to this model. Keep the structured brief as the source of truth.', apiKey);
        }
        throw primaryError;
      }
    });

    const images = await Promise.all(requests);
    response.status(200).json({ images, referenceCount: referenceUrls.length });
  } catch (err) {
    console.error('Pollinations error', err);
    response.status(500).json({ error: 'Ошибка генерации: ' + (err && err.message ? err.message : String(err)) });
  }
}
