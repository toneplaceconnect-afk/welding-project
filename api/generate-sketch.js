// Serverless-функция Vercel: /api/generate-sketch
// Принимает POST { prompt, count } с фронтенда и генерирует изображения
// через Pollinations. Ключ хранится только в переменных окружения Vercel.
// Возвращает { images: ["data:image/...;base64,...", ...] }.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    response.status(500).json({
      error: 'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.'
    });
    return;
  }

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const clientPrompt = String(body.prompt || '').trim();
  const count = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 4);

  if (!clientPrompt) {
    response.status(400).json({ error: 'Пустой запрос (prompt).' });
    return;
  }

  // Большой статический мастер-промт: он превращает короткий бриф формы
  // в технически правдоподобную коммерческую визуализацию, а не в
  // абстрактную иллюстрацию. Английский используется намеренно: Flux
  // обычно точнее следует сложным структурированным инструкциям на нём.
  const masterPrompt = `
You are an expert industrial designer, architectural visualizer and professional commercial photographer specializing in custom welded metalwork, metal-and-wood furniture, architectural structures and engineering products.

Create a highly photorealistic commercial photograph based on the CLIENT BRIEF below.

The client brief is the source of truth. Preserve every explicitly specified characteristic: object type, purpose, dimensions, proportions, materials, metal profile, wood species, colors, style, quantity, installation location and special requirements.

DESIGN ACCURACY:
Treat the described object as a real manufactured construction that could actually be built by a professional welding workshop. Respect realistic structural logic, believable profile-tube dimensions, load-bearing supports, welded joints, fasteners where appropriate, realistic metal thickness, correct wood-to-metal relationships, practical connections and believable construction details.

Do not invent a different product category. Do not turn the object into fantasy architecture. Do not add decorative elements that contradict the brief. If a detail is unspecified, choose a restrained, practical professional solution consistent with the requested style and intended use.

MATERIAL REALISM:
Show real metal, realistic powder coating or paint, subtle surface texture, physically correct reflections, believable welded seams, cut edges, fasteners and joints where relevant. Show natural wood grain, pores, edges, small imperfections and realistic finishing. Materials must react correctly to light and have different optical properties.

SCENE AND SCALE:
Create one continuous real photographic scene. The object must have believable human scale and correct perspective. Show the complete construction whenever an overall view is requested. Place it naturally in the specified environment so its purpose is immediately understandable.

ENVIRONMENT:
Use a believable real environment matching the requested installation: house, apartment, terrace, garden, yard, workshop, garage, cafe, bar, restaurant, shop or industrial space. Architecture, floor, walls, furniture and surrounding objects must have realistic scale and spatial relationships. The environment supports the product and does not compete with it.

LIGHTING AND CAMERA:
Professional full-frame commercial architectural/product photography. Natural realistic illumination appropriate to the environment. Balanced exposure, soft directional light, realistic contact shadows, accurate metal reflections, natural light falloff, high dynamic range, clean highlights, realistic ambient occlusion, natural white balance and restrained depth of field. Use a believable 35mm, 50mm or 85mm photographic perspective appropriate to the selected view.

PHOTOREALISM:
The final result must look like a genuine photograph taken on location by a professional architectural and product photographer. Prioritize physical realism, accurate geometry, realistic materials, believable scale, natural lighting, photographic micro-detail and coherent perspective.

ABSOLUTE NEGATIVES:
No abstract art. No concept-art look. No 3D-render appearance. No CGI plastic surfaces. No collage. No split screen. No multiple objects unless the brief explicitly requests a pair or set. No tiny inset images. No exploded view. No blueprint overlay. No labels. No captions. No text. No logos. No watermark. No UI elements. No impossible joints. No floating parts. No warped geometry. No extra legs, handles, shelves or supports that were not requested.

CLIENT BRIEF:
${clientPrompt}
`;

  const viewInstructions = [
    `VIEW A — HERO PRODUCT PHOTOGRAPH.
Show the exact object from a strong three-quarter front perspective at approximately human eye level. Make the complete construction, silhouette, proportions, materials and intended function immediately readable. The object is the primary visual focus, with enough environmental context to explain where it will be used. This is the main portfolio photograph.`,
    `VIEW B — ALTERNATIVE CONSTRUCTION PHOTOGRAPH.
Show the exact same object, with exactly the same design, dimensions, materials and colors, but from a clearly different camera position: side three-quarter, diagonal or slightly opposite perspective selected according to the object's geometry. Reveal structural information that is less visible in VIEW A: frame depth, profile thickness, supports, joints, connections, rear/side structure, mounting points and wood-to-metal connections where applicable. This must be a genuinely different photograph of the same finished object, not a second copy of VIEW A.`,
    `VIEW C — MATERIAL AND CONSTRUCTION DETAIL.
Show the exact same object in a professional close-up/detail photograph. Focus on the most important structural or material detail: welded joint, metal profile, fastener, wood-to-metal connection, surface finishing or functional mechanism. Keep enough surrounding context to identify the object.`,
    `VIEW D — FUNCTIONAL SIDE PRESENTATION.
Show the exact same object from a clean side or slightly elevated perspective that makes its geometry, depth, proportions and functional construction especially clear. Keep the design identical to the client brief and the previous views.`
  ];

  try {
    const requests = Array.from({ length: count }, async (_, index) => {
      const fullPrompt =
        masterPrompt + '\n\n' +
        viewInstructions[index % viewInstructions.length] +
        '\n\nIMPORTANT: Preserve the exact client design across all views. Only the camera position and photographic composition change.';

      const url =
        'https://gen.pollinations.ai/image/' +
        encodeURIComponent(fullPrompt) +
        '?model=flux&width=1024&height=768&nologo=true';

      const aiResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + apiKey
        }
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        let message = 'Pollinations не смог сгенерировать изображение.';
        try {
          const errorData = JSON.parse(errorText);
          message =
            (errorData && errorData.error && errorData.error.message) ||
            errorData.message ||
            message;
        } catch (e) {
          if (errorText) message = errorText.slice(0, 500);
        }
        throw new Error('Pollinations ' + aiResponse.status + ': ' + message);
      }

      const contentType = aiResponse.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await aiResponse.arrayBuffer());
      return 'data:' + contentType.split(';')[0] + ';base64,' + buffer.toString('base64');
    });

    const images = await Promise.all(requests);
    response.status(200).json({ images });
  } catch (err) {
    console.error('Pollinations error', err);
    response.status(500).json({
      error: 'Ошибка генерации: ' +
        (err && err.message ? err.message : String(err))
    });
  }
}
