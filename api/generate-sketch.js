// Serverless-функция Vercel: /api/generate-sketch
// POST { prompt, count, referenceImages }. Ключ только в Vercel env.
const MASTER_PROMPT=`You are an expert industrial designer, furniture designer, welding engineer and professional commercial photographer specializing in custom metalwork and metal-and-wood products.
Create a highly photorealistic commercial photograph from the CLIENT BRIEF.

HIGHEST PRIORITY — PRODUCT IDENTITY: The named product category is absolute. Create exactly that product. Furniture must remain furniture; architectural items must remain architectural. Never reinterpret a table, bench, shelf, counter or furniture as a canopy, pergola, gazebo, pavilion, building frame, fence or other large structure.

The client brief is the source of truth. Preserve product type, purpose, overall dimensions, component dimensions, proportions, materials, cross-sections, profiles, colors, style, quantity, installation location and special requirements.

COMPONENT-BASED CONSTRUCTION: Treat the product as an assembly of separate physical components. Distinguish component overall dimensions, element type, cross-section/thickness, length/width/height, quantity, orientation, position and relationship to other components.

CRITICAL UNIT RULE: A dimension such as 100x150 mm attached to a timber beam means beam cross-section 100x150 mm, NOT that the tabletop is 100x150 mm. A dimension such as 150x150 mm attached to a timber beam means beam cross-section 150x150 mm. If overall product dimensions and component cross-sections are both provided, do not confuse them.

CONSTRUCTION LOGIC: The object must look manufacturable by a professional workshop. Respect realistic structural logic, profile-tube dimensions, load-bearing supports, welds, fasteners where appropriate, metal thickness, joinery and wood-to-metal relationships. Do not invent large structural frames or extra supports merely because the style is industrial/loft.

REFERENCE IMAGES: Use supplied references for geometry, materials, proportions, silhouette and design cues. Keep requested product identity and component structure dominant.

MATERIAL REALISM: Realistic powder-coated/painted steel, believable reflections, welded seams, cut edges and joints; natural wood grain, pores, edges and end grain; physically correct light response.

COMPOSITION: For furniture, furniture is unmistakable and occupies about 70–80% of the image. Show the complete object from floor to top for an overall view. Keep environment secondary and useful only for scale/use.

PHOTOGRAPHY: Professional full-frame commercial product/interior photography, natural realistic light, balanced exposure, soft directional shadows, accurate reflections, HDR, realistic ambient occlusion, natural white balance, believable 35mm/50mm/85mm perspective.

PHOTOREALISM: Genuine photograph of a real manufactured object, not illustration or generic 3D render. Prioritize geometry, construction, materials, scale, perspective and photographic micro-detail.

ABSOLUTE NEGATIVES: No abstract art, concept-art look, CGI plastic, collage, split screen, inset images, exploded view, blueprint overlay, labels, captions, text, logos, watermark, UI, fantasy architecture, canopy, pergola, gazebo, pavilion, building frame when requested product is furniture, impossible joints, floating parts, warped geometry, extra legs, shelves, handles, roofs, walls or supports not present in brief.`;
const VIEWS=[
`VIEW A — HERO PHOTOGRAPH. Show exactly one finished product from a strong three-quarter front perspective at human eye level. Complete silhouette, component structure, proportions, materials and function must be immediately readable.`,
`VIEW B — SAME PRODUCT, DIFFERENT CAMERA. Show the exact same physical product as VIEW A: identical components, dimensions, materials, colors, construction, proportions and finish. Move the camera substantially to the side/diagonal to reveal depth, supports, joints and connections. DO NOT redesign, simplify, add or remove anything.`,
`VIEW C — SAME PRODUCT, CONSTRUCTION DETAIL. Show a close professional detail while retaining enough context to identify the exact same product.`,
`VIEW D — SAME PRODUCT, FUNCTIONAL SIDE VIEW. Show the exact same product from a clean side or slightly elevated angle. Only camera position and composition change.`
];
function dataUrlToBlob(dataUrl){const m=String(dataUrl||'').match(/^data:([^;,]+);base64,(.+)$/);if(!m)return null;return new Blob([Buffer.from(m[2],'base64')],{type:m[1]||'image/jpeg'})}
async function uploadImage(dataUrl,index,apiKey){const blob=dataUrlToBlob(dataUrl);if(!blob)throw Error('Некорректный формат изображения №'+(index+1));const form=new FormData();form.append('file',blob,'reference-'+(index+1)+'.jpg');const r=await fetch('https://gen.pollinations.ai/upload',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:form});if(!r.ok)throw Error('Не удалось загрузить изображение №'+(index+1)+': '+(await r.text()).slice(0,400));const d=await r.json();if(!d.url)throw Error('Pollinations не вернул URL изображения №'+(index+1));return d.url}
async function generate(prompt,refs,apiKey){const payload={model:'flux',prompt,size:'1024x768',n:1,response_format:'b64_json'};if(refs.length)payload.image=refs;const r=await fetch('https://gen.pollinations.ai/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error('Pollinations '+r.status+': '+(await r.text()).slice(0,500));const d=await r.json(),item=d?.data?.[0];if(!item)throw Error('Pollinations не вернул изображение.');if(item.b64_json)return'data:image/png;base64,'+item.b64_json;if(item.url)return item.url;throw Error('Pollinations вернул неизвестный формат изображения.')}
async function fallback(prompt,apiKey){const u='https://gen.pollinations.ai/image/'+encodeURIComponent(prompt)+'?model=flux&width=1024&height=768&nologo=true';const r=await fetch(u,{headers:{Authorization:'Bearer '+apiKey}});if(!r.ok)throw Error('Pollinations '+r.status+': '+(await r.text()).slice(0,500));const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0];return'data:'+type+';base64,'+Buffer.from(await r.arrayBuffer()).toString('base64')}
export default async function handler(request,response){if(request.method!=='POST')return response.status(405).json({error:'Method not allowed'});const apiKey=process.env.POLLINATIONS_API_KEY;if(!apiKey)return response.status(500).json({error:'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.'});let body=request.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch(e){body={}}}body=body||{};const clientPrompt=String(body.prompt||'').trim();const count=Math.min(Math.max(parseInt(body.count,10)||2,1),4);const inputs=Array.isArray(body.referenceImages)?body.referenceImages.slice(0,5):[];if(!clientPrompt)return response.status(400).json({error:'Пустой запрос (prompt).' });
try{
 let refs=inputs.length?await Promise.all(inputs.map((x,i)=>uploadImage(x,i,apiKey))):[];
 const makePrompt=i=>MASTER_PROMPT+'\n\nCLIENT BRIEF / STRUCTURED PRODUCT:\n'+clientPrompt+'\n\n'+VIEWS[i]+'\n\nIDENTITY LOCK: This is one exact physical product. Preserve every component, dimension, material, color and proportion. Only camera position, crop and photographic composition may change.';
 // First image establishes the canonical visual identity.
 const firstPrompt=makePrompt(0);
 let first;try{first=await generate(firstPrompt,refs,apiKey)}catch(e){if(refs.length)first=await fallback(firstPrompt,apiKey);else throw e}
 const images=[first];
 // For subsequent views, use the generated canonical image as the strongest visual reference.
 if(count>1){let canonicalUrl;try{canonicalUrl=await uploadImage(first,0,apiKey)}catch(e){console.warn('Could not upload canonical image:',e)}const secondRefs=canonicalUrl?[canonicalUrl,...refs]:refs;let second;try{second=await generate(makePrompt(1),secondRefs,apiKey)}catch(e){second=await fallback(makePrompt(1)+'\nThe first view is the canonical design. Preserve it exactly.',apiKey)}images.push(second)}
 for(let i=2;i<count;i++){let extra;try{extra=await generate(makePrompt(i),refs,apiKey)}catch(e){extra=await fallback(makePrompt(i),apiKey)}images.push(extra)}
 return response.status(200).json({images,referenceCount:refs.length,identityLocked:true});
}catch(err){console.error('Pollinations error',err);return response.status(500).json({error:'Ошибка генерации: '+(err?.message||String(err))})}}
