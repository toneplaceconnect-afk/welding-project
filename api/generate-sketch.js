// Serverless-функция Vercel: /api/generate-sketch
// Принимает POST { prompt, count, referenceImages } и генерирует изображения
// через Pollinations. Ключ хранится только в переменных окружения Vercel.

const MASTER_PROMPT = `
You are an expert industrial designer, architectural visualizer and professional commercial photographer specializing in custom welded metalwork, metal-and-wood furniture, architectural structures and engineering products.

Create a highly photorealistic commercial photograph based on the CLIENT BRIEF below.

The client brief is the source of truth. Preserve every explicitly specified characteristic: object type, purpose, dimensions, proportions, materials, metal profile, wood species, colors, style, quantity, installation location and special requirements.

DESIGN ACCURACY:
Treat the described object as a real manufactured construction that could actually be built by a professional welding workshop. Respect realistic structural logic, believable profile-tube dimensions, load-bearing supports, welded joints, fasteners where appropriate, realistic metal thickness, correct wood-to-metal relationships, practical connections and believable construction details.

Do not invent a different product category. Do not turn the object into fantasy architecture. Do not add decorative elements that contradict the brief. If a detail is unspecified, choose a restrained, practical professional solution consistent with the requested style and intended use.

REFERENCE IMAGES:
If reference images are supplied, treat them as real visual references. Preserve the useful information from them: site geometry, perspective, existing architecture, proportions, material appearance, silhouette and requested design cues. Do not blindly copy unrelated objects from references. If a site photo is provided, keep the surrounding architecture believable and place the requested object naturally into that space.

MATERIAL REALISM:
Show real metal, realistic powder coating or paint, subtle surface texture, physically correct reflections, believable welded seams, cut edges, fasteners and joints where relevant. Show natural wood grain, pores, edges, small imperfections and realistic finishing. Materials must react correctly to light and have different optical properties.

SCENE AND SCALE:
Create one continuous real photographic scene. The object must have believable human scale and correct perspective. Show the complete construction whenever an overall view is requested. Place it naturally in the specified environment so its purpose is immediately understandable.

LIGHTING AND CAMERA:
Professional full-frame commercial architectural/product photography. Natural realistic illumination appropriate to the environment. Balanced exposure, soft directional light, realistic contact shadows, accurate metal reflections, natural light falloff, high dynamic range, clean highlights, realistic ambient occlusion, natural white balance and restrained depth of field. Use a believable 35mm, 50mm or 85mm photographic perspective appropriate to the selected view.

PHOTOREALISM:
The final result must look like a genuine photograph taken on location by a professional architectural and product photographer. Prioritize physical realism, accurate geometry, realistic materials, believable scale, natural lighting, photographic micro-detail and coherent perspective.

ABSOLUTE NEGATIVES:
No abstract art. No concept-art look. No 3D-render appearance. No CGI plastic surfaces. No collage. No split screen. No tiny inset images. No exploded view. No blueprint overlay. No labels. No captions. No text. No logos. No watermark. No UI elements. No impossible joints. No floating parts. No warped geometry. No extra legs, handles, shelves or supports that were not requested.
`;

const VIEW_INSTRUCTIONS = [
  `VIEW A — HERO PRODUCT PHOTOGRAPH. Show the exact object from a strong three-quarter front perspective at approximately human eye level. Make the complete construction, silhouette, proportions, materials and intended function immediately readable. The object is the primary visual focus, with enough environmental context to explain where it will be used. This is the main portfolio photograph.`,
  `VIEW B — ALTERNATIVE CONSTRUCTION PHOTOGRAPH. Show the exact same object, with exactly the same design, dimensions, materials and colors, but from a clearly different camera position: side three-quarter, diagonal or slightly opposite perspective selected according to the object's geometry. Reveal structural information that is less visible in VIEW A: frame depth, profile thickness, supports, joints, connections, rear/side structure, mounting points and wood-to-metal connections where applicable. This must be a genuinely different photograph of the same finished object, not a second copy of VIEW A.`,
  `VIEW C — MATERIAL AND CONSTRUCTION DETAIL. Show the exact same object in a professional close-up/detail photograph. Focus on the most important structural or material detail: welded joint, metal profile, fastener, wood-to-metal connection, surface finishing or functional mechanism. Keep enough surrounding context to identify the object.`,
  `VIEW D — FUNCTIONAL SIDE PRESENTATION. Show the exact same object from a clean side or slightly elevated perspective that makes its geometry, depth, proportions and functional construction especially clear. Keep the design identical to the client brief and the previous views.`
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
  const payload = {
    model,
    prompt,
    size: '1024x768',
    n: 1,
    response_format: 'b64_json'
  };
  if (referenceUrls.length) payload.image = referenceUrls;

  const aiResponse = await fetch('https://gen.pollinations.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
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
  const url =
    'https://gen.pollinations.ai/image/' +
    encodeURIComponent(prompt) +
    '?model=flux&width=1024&height=768&nologo=true';

  const aiResponse = await fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + apiKey }
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error('Pollinations ' + aiResponse.status + ': ' + errorText.slice(0, 500));
  }

  const contentType = aiResponse.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await aiResponse.arrayBuffer());
  return 'data:' + contentType.split(';')[0] + ';base64,' + buffer.toString('base64');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: 'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.' });
    return;
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const clientPrompt = String(body.prompt || '').trim();
  const count = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 4);
  const inputReferences = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 5) : [];

  if (!clientPrompt) {
    response.status(400).json({ error: 'Пустой запрос (prompt).' });
    return;
  }

  try {
    let referenceUrls = [];
    if (inputReferences.length) {
      referenceUrls = await Promise.all(
        inputReferences.map((img, i) => uploadReference(img, i, apiKey))
      );
    }

    const requests = Array.from({ length: count }, async (_, index) => {
      const fullPrompt =
        MASTER_PROMPT +
        '\n\nCLIENT BRIEF:\n' + clientPrompt +
        '\n\n' + VIEW_INSTRUCTIONS[index % VIEW_INSTRUCTIONS.length] +
        '\n\nIMPORTANT: Preserve the exact client design across all views. Only the camera position and photographic composition change.';

      try {
        // /v1/images/generations позволяет передавать несколько reference images.
        // Это основной путь, когда клиент приложил реальные фотографии или эскизы.
        return await generateWithReferences(fullPrompt, 'flux', referenceUrls, apiKey);
      } catch (primaryError) {
        // Если текущая конфигурация модели/ключа не принимает image input,
        // не ломаем генератор: делаем качественную текстовую генерацию.
        if (referenceUrls.length) {
          console.warn('Reference generation failed, using text fallback:', primaryError);
          return await generateFallback(
            fullPrompt + '\nReference images were supplied by the client but could not be attached to this model. Keep all reference-dependent details conservative and physically plausible.',
            apiKey
          );
        }
        throw primaryError;
      }
    });

    const images = await Promise.all(requests);
    response.status(200).json({ images, referenceCount: referenceUrls.length });
  } catch (err) {
    console.error('Pollinations error', err);
    response.status(500).json({
      error: 'Ошибка генерации: ' + (err && err.message ? err.message : String(err))
    });
  }
}
