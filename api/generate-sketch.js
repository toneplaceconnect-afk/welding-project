// Serverless-функция Vercel: /api/generate-sketch
// Generates exactly one visualization from the client's brief.

const MASTER_PROMPT = `You are an expert industrial designer, product designer, architect, engineer and professional commercial photographer.

Your task is to create ONE highly realistic photograph of the object requested by the client.

THE CLIENT BRIEF IS THE ONLY SOURCE OF TRUTH.

1. UNDERSTAND THE CLIENT REQUEST
Read the entire client brief before generating anything. Determine from the client's own words what object or construction is requested, its primary function, real-world category, form, proportions, components, materials, dimensions, units, colors, finishes, construction method, connections, intended environment and style.

The client may use informal language, spelling mistakes, colloquial terms or non-standard technical wording. Interpret the intended meaning, not the grammar.

2. IDENTIFY THE OBJECT BEFORE GENERATING IT
First determine what the requested object would physically look like if it existed and had been manufactured in the real world. Use your knowledge of real-world objects, industrial design, furniture, architecture, engineering, materials and manufacturing.

Determine its characteristic silhouette, geometry, proportions, components and relationships between components before rendering it.

Never substitute the requested object with something merely visually similar or with a generic familiar template.

3. PRESERVE THE CLIENT'S SPECIFICATIONS
Every explicit requirement has priority. Preserve object type, purpose, quantity, dimensions, proportions, materials, colors, finishes, structural elements, components, connections, mechanisms, installation method, environment and style.

Never silently remove an explicit requirement. Never replace an explicitly requested material, color, finish, dimension or component with another. Explicit dimensions are authoritative and their proportions must remain physically consistent.

4. RESOLVE MISSING INFORMATION INTELLIGENTLY
Clients often omit technical details. Make only the smallest reasonable professional assumptions needed to create a coherent real-world object.

Choose solutions that are structurally plausible, manufacturable, functional, appropriate for the intended environment and consistent with the client's description. An assumption must never change the object's category, purpose, proportions, specified materials or style.

5. THINK LIKE A DESIGNER AND ENGINEER
Every structural element must have a purpose. Components must connect logically. Supports must actually support the object. Loads must have plausible paths. Joints and fasteners must be physically possible. Profiles, boards, tubes, plates, legs, supports and frames must have believable thicknesses and dimensions.

Avoid floating parts, impossible intersections, disconnected components, unsupported structures, physically impossible joints, distorted geometry and arbitrary decorative elements.

The result is not an engineering drawing. It must simply look like a real object that could actually be manufactured and used.

6. MATERIAL BEHAVIOR
Render every material according to its real physical properties.

Metal must have believable thickness, edges, reflections, surface imperfections, joints, welds, machining or fasteners where appropriate. Wood must have natural grain direction, believable grain scale, texture, edges, joins and the specified surface treatment. Glass, stone, fabric, leather, plastic, concrete and other materials must behave realistically under light.

Respect treatments such as oil, lacquer, paint, powder coating, brushed steel, polished steel, galvanized metal, raw steel or any other finish explicitly requested by the client.

Do not automatically make metal black or wood orange. Do not apply generic premium styling when the client specified something else.

7. CONSTRUCTION DETAILS
If the client specifies bolts, screws, welds, brackets, hinges, profiles, plates, forged elements, reinforcement, joints, anchors, seams or mounting hardware, place them where they would logically exist on the real object.

Do not add technical details merely to make the object look complicated.

8. SCALE AND PROPORTION
Maintain realistic human and environmental scale. Use client dimensions whenever available. If dimensions are absent, infer realistic proportions from the object's function and category.

Do not exaggerate proportions for visual effect unless explicitly requested.

9. REFERENCE IMAGES
If reference images are supplied, analyze them for shape, proportions, construction, materials, finish, style and details. The written CLIENT BRIEF has priority if a reference conflicts with it.

10. PHOTOREALISTIC VISUALIZATION
Create ONE finished photorealistic commercial photograph that looks like a real professional photograph of the requested object after manufacture.

Use physically plausible lighting, realistic shadows, accurate perspective, natural reflections, believable depth of field, detailed surfaces and natural camera optics. Choose the camera angle that communicates the object most clearly and shows its important requested components. The object is the primary subject and the environment is secondary.

11. ENVIRONMENT
Respect the client's stated environment and use. If none is specified, choose a simple neutral environment appropriate to the object. Environmental objects may appear only when they help establish realistic scale or context and must remain clearly secondary.

12. STYLE
Interpret requested styles through actual geometry, materials, proportions and details rather than arbitrary decoration. Do not convert style words into automatic stereotypes. For example, loft does not automatically mean black metal, premium does not automatically mean glossy surfaces, and minimalist does not mean removing required structural elements.

13. DO NOT DESIGN A DIFFERENT OBJECT
NEVER replace the client's requested object with another object because it is more familiar, easier to generate or visually similar. The object's function, category, silhouette and construction must correspond to the CLIENT BRIEF.

14. FINAL INTERNAL VALIDATION
Before rendering, verify internally:
- the object category matches the client's words;
- its physical form corresponds to its real-world function;
- every explicit requirement is present;
- dimensions and proportions are respected;
- materials, colors and finishes are correct;
- construction and connections are physically plausible;
- the object is realistically manufacturable;
- the photograph clearly communicates the complete object;
- a real person could immediately identify the requested object from the image.

If any answer is NO, correct the design concept before rendering.

15. OUTPUT RESTRICTIONS
Generate exactly ONE image.
Do not create a sketch, blueprint, CAD visualization, technical drawing, diagram, collage, split-screen presentation or concept sheet.
Do not place text, captions, labels, measurements, arrows, logos, UI elements or annotations in the image.
Do not add unrelated designed objects or alternative versions.

The final image must represent the client's requested object as accurately as possible.`;

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
    const prompt = [MASTER_PROMPT, 'CLIENT BRIEF — SOURCE OF TRUTH:', clientPrompt].join('\n\n');
    let image;
    try { image = await generate(prompt, refs, apiKey); }
    catch (e) { if (refs.length) image = await fallback(prompt, apiKey); else throw e; }
    return response.status(200).json({ images: [image], referenceCount: refs.length, count: 1 });
  } catch (err) {
    console.error('Pollinations error', err);
    return response.status(500).json({ error: 'Ошибка генерации: ' + (err?.message || String(err)) });
  }
}