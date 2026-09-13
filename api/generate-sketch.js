// Serverless-функция Vercel: /api/generate-sketch
// POST { prompt, count, referenceImages }. Ключ только в Vercel env.
const MASTER_PROMPT=`You are an expert industrial designer, furniture designer, welding engineer and professional commercial photographer specializing in custom metalwork and metal-and-wood products.
Create a highly photorealistic commercial photograph from the CLIENT BRIEF.

HIGHEST PRIORITY — PRODUCT IDENTITY: The named product category is absolute. Create exactly that product. Never reinterpret the requested product as another object. Furniture must remain furniture; architectural items must remain architectural.

CLIENT BRIEF IS THE SOURCE OF TRUTH. Preserve product type, purpose, overall dimensions, component dimensions, proportions, materials, cross-sections, profiles, colors, style, quantity, installation location and special requirements. Never replace an explicit client requirement with a generic design choice.

COMPONENT-BASED CONSTRUCTION: Treat the product as an assembly of separate physical components. Distinguish overall product dimensions from component dimensions and cross-sections.

CRITICAL UNIT RULE: A dimension attached to a timber beam, tube, profile or other component describes that component only, NOT the whole product. Never confuse overall product dimensions with component cross-sections.

CONSTRUCTION LOGIC: The object must look manufacturable by a professional workshop. Respect realistic structural logic, profile-tube dimensions, load-bearing supports, welds, fasteners where appropriate, metal thickness, joinery and wood-to-metal relationships.

FURNITURE SAFETY RULE: When the requested product is furniture, keep it functional and recognizable as ordinary furniture. Preserve usable space for people, chairs, access and normal operation. Do not turn furniture into architecture or sculpture.

ARCHITECTURAL PRODUCT RULE: When the requested product is a pergola, gazebo, canopy, fence, gate, staircase or other architectural/structural item, keep it architectural and manufacturable. Do NOT remove required posts, beams, roof/slats, railings or other structural elements merely because generic furniture rules would reject them. Follow the requested product's actual construction logic.

REFERENCE IMAGES: Use supplied references for geometry, materials, proportions, silhouette and design cues. Keep the requested product identity and component structure dominant. A reference is not permission to add unrelated structural elements.

MATERIAL REALISM: Realistic powder-coated/painted steel, believable reflections, welded seams, cut edges and joints; natural wood grain, pores, edges and end grain; physically correct light response.

COMPOSITION: Show the complete requested product in a useful real environment. For furniture, the furniture should dominate the frame. For architectural products, show enough surrounding context to communicate scale, installation and function without hiding the product.

PHOTOGRAPHY: Professional full-frame commercial product/interior/architectural photography, natural realistic light, balanced exposure, soft directional shadows, accurate reflections, HDR, realistic ambient occlusion, natural white balance, believable 24mm/35mm/50mm/85mm perspective appropriate to the subject.

PHOTOREALISM: Genuine photograph of a real manufactured object, not illustration or generic 3D render. Prioritize geometry, construction, materials, scale, perspective and photographic micro-detail.

GLOBAL NEGATIVES: No abstract art, concept-art look, CGI plastic, collage, split screen, inset images, exploded view, blueprint overlay, labels, captions, text, logos, watermark, UI, fantasy elements, impossible joints, floating parts, warped geometry or unexplained extra components. Never add an architectural element that is not supported by the requested product or brief.`;

function productGuard(brief){
 const s=String(brief||'').toLowerCase();
 if(/пергол|pergola/.test(s)) return `PRODUCT-SPECIFIC LOCK — PERGOLA: This is an OPEN FREESTANDING PERGOLA for an outdoor seating area. It MUST read immediately as a pergola: vertical structural posts, perimeter beams and a clearly visible open roof made from evenly spaced wooden slats/rafters. The roof is lightweight and semi-transparent, creating patterned shade. NO solid enclosed roof, NO walls, NO windows, NO enclosed room, NO gazebo-like enclosure unless explicitly requested. Keep the lower area open for a table and chairs. Preserve the requested overall dimensions and realistic structural proportions. Use black matte metal for the structural frame and natural wood for the roof slats when specified.`;
 if(/беседк/.test(s)) return `PRODUCT-SPECIFIC LOCK — GAZEBO: Create an outdoor gazebo/pavilion with the requested open or enclosed structure exactly as described. Keep posts, beams and roof structurally coherent. Do not turn it into furniture or a different building.`;
 if(/навес|козыр/.test(s)) return `PRODUCT-SPECIFIC LOCK — CANOPY: Create a real functional canopy/awning with structural supports and a roof plane appropriate to the brief. Do not turn it into a gazebo, furniture item or closed building unless explicitly requested.`;
 if(/забор|ворот|калит/.test(s)) return `PRODUCT-SPECIFIC LOCK — FENCE/GATE: Create the requested fence, gate or wicket as a real installable boundary/entry element with posts, panels, hinges and supports only where appropriate. Do not turn it into a room or furniture.`;
 if(/лестниц|перил/.test(s)) return `PRODUCT-SPECIFIC LOCK — STAIR/RAILING: Create a real functional staircase or railing with correct human scale, rise/run or guardrail geometry, supports and safe circulation. Do not turn it into decorative sculpture.`;
 if(/мангал|барбекю|\bbbq\b/.test(s)) return `PRODUCT-SPECIFIC LOCK — BBQ: Create a real manufacturable barbecue/grill zone or brazier with heat-safe construction and the requested materials. Keep it recognizable as a cooking product.`;
 if(/\bстол\b|обеден.*стол|dining table/.test(s)) return `PRODUCT-SPECIFIC LOCK — DINING TABLE: This is a normal functional dining table for a home. It MUST have a clear horizontal tabletop supported by a separate base/legs. Keep the entire area under the tabletop open and usable for chairs and a seated person's legs. The tabletop must NOT be pierced by, wrapped around, supported by or connected to a central wooden column. NO central column, tower, wall, partition, vertical post rising through the tabletop, canopy or architectural frame. The metal base must be a lightweight table support, not a building structure. Do not invent shelves or additional surfaces unless explicitly requested.`;
 if(/скамь|табурет|bench|stool/.test(s)) return `PRODUCT-SPECIFIC LOCK — SEATING: Create functional seating with a clear seat surface and a realistic supporting base/legs. Do not turn it into a wall, platform, pavilion or architectural structure.`;
 if(/стеллаж|полк|shelf|rack/.test(s)) return `PRODUCT-SPECIFIC LOCK — SHELVING: Create a functional shelving/rack unit with clearly separated shelves and a realistic supporting frame. Do not turn it into a building frame or room partition.`;
 if(/стойк|counter|барн|ресепш/.test(s)) return `PRODUCT-SPECIFIC LOCK — COUNTER: Create a functional counter/stand with a clear working surface and realistic support structure. Do not turn it into a kiosk, pavilion or building.`;
 return `PRODUCT-SPECIFIC LOCK: Keep the requested product category visually obvious, functional and manufacturable. Do not reinterpret it as another product type.`;
}

const VIEWS=[
`VIEW A — CANONICAL HERO. Establish the canonical physical product. Show exactly one finished product from a strong three-quarter perspective appropriate to the subject. For furniture use human eye level; for pergolas/canopies use an eye-level or slightly elevated architectural angle that clearly reveals the roof structure. Show the complete silhouette, component structure, proportions, materials and function. This image defines the exact design that every subsequent view must reproduce.`,
`VIEW B — RE-PHOTOGRAPH THE SAME EXACT PHYSICAL PRODUCT. The supplied canonical image is the authoritative design reference. Do NOT redesign the object. Re-photograph that exact same physical product from a clearly different camera position. Preserve identical geometry, component count, component shapes, thicknesses, joints, materials, colors, finish, dimensions, proportions and silhouette. Change ONLY camera position, viewing angle, visible side, crop and natural photographic lighting. Never add, remove, replace, merge or relocate any component.`,
`VIEW C — SAME EXACT PRODUCT, CONSTRUCTION DETAIL. Use the canonical product image as the identity reference. Show a close professional detail of the same object and its real materials/connections. Do not alter the design or add components.`,
`VIEW D — SAME EXACT PRODUCT, FUNCTIONAL SIDE VIEW. Use the canonical product image as the identity reference. Show the exact same product from a clean side or slightly elevated angle. Only camera position and composition change.`
];

function dataUrlToBlob(dataUrl,index){const m=String(dataUrl||'').match(/^data:([^;,]+);base64,(.+)$/);if(!m)throw Error('Некорректный формат изображения №'+(index+1));return new Blob([Buffer.from(m[2],'base64')],{type:m[1]||'image/jpeg'})}
async function uploadImage(dataUrl,index,apiKey){const blob=dataUrlToBlob(dataUrl,index);const form=new FormData();form.append('file',blob,'reference-'+(index+1)+'.jpg');const r=await fetch('https://gen.pollinations.ai/upload',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:form});if(!r.ok)throw Error('Не удалось загрузить изображение №'+(index+1)+': '+(await r.text()).slice(0,400));const d=await r.json();if(!d.url)throw Error('Pollinations не вернул URL изображения №'+(index+1));return d.url}
async function parseImageResponse(r){if(!r.ok)throw Error('Pollinations '+r.status+': '+(await r.text()).slice(0,600));const d=await r.json();const item=d?.data?.[0];if(!item)throw Error('Pollinations не вернул изображение.');if(item.b64_json)return'data:image/png;base64,'+item.b64_json;if(item.url)return item.url;throw Error('Pollinations вернул неизвестный формат изображения.')}
async function generate(prompt,refs,apiKey){const payload={model:'flux',prompt,size:'1024x768',n:1,response_format:'b64_json'};if(refs.length)payload.image=refs;const r=await fetch('https://gen.pollinations.ai/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(payload)});return parseImageResponse(r)}
async function editCanonical(dataUrl,prompt,apiKey){const blob=dataUrlToBlob(dataUrl,0);const form=new FormData();form.append('image',blob,'canonical.png');form.append('prompt',prompt);form.append('model','kontext');form.append('size','1024x768');const r=await fetch('https://gen.pollinations.ai/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:form});return parseImageResponse(r)}
async function fallback(prompt,apiKey){const u='https://gen.pollinations.ai/image/'+encodeURIComponent(prompt)+'?model=flux&width=1024&height=768&nologo=true';const r=await fetch(u,{headers:{Authorization:'Bearer '+apiKey}});if(!r.ok)throw Error('Pollinations '+r.status+': '+(await r.text()).slice(0,500));const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0];return'data:'+type+';base64,'+Buffer.from(await r.arrayBuffer()).toString('base64')}

export default async function handler(request,response){
 if(request.method!=='POST')return response.status(405).json({error:'Method not allowed'});
 const apiKey=process.env.POLLINATIONS_API_KEY;
 if(!apiKey)return response.status(500).json({error:'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.'});
 let body=request.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch(e){body={}}}body=body||{};
 const clientPrompt=String(body.prompt||'').trim();
 const count=Math.min(Math.max(parseInt(body.count,10)||2,1),4);
 const inputs=Array.isArray(body.referenceImages)?body.referenceImages.slice(0,5):[];
 if(!clientPrompt)return response.status(400).json({error:'Пустой запрос (prompt).'});
 try{
  const refs=inputs.length?await Promise.all(inputs.map((x,i)=>uploadImage(x,i,apiKey))):[];
  const guard=productGuard(clientPrompt);
  const makePrompt=i=>MASTER_PROMPT+'\n\n'+guard+'\n\nCLIENT BRIEF / STRUCTURED PRODUCT:\n'+clientPrompt+'\n\n'+VIEWS[i]+'\n\nIDENTITY LOCK: This is one exact physical product. Preserve every component, dimension, material, color, proportion, silhouette and construction detail. Only camera position, crop, lighting and photographic composition may change.';
  let first;
  try{first=await generate(makePrompt(0),refs,apiKey)}catch(e){if(refs.length)first=await fallback(makePrompt(0),apiKey);else throw e}
  const images=[first];
  for(let i=1;i<count;i++){
   let image;
   try{image=await editCanonical(first,makePrompt(i),apiKey)}catch(editError){
    console.warn('Canonical image edit failed, retrying with canonical reference:',editError?.message||editError);
    let canonicalUrl=null;
    try{canonicalUrl=await uploadImage(first,0,apiKey)}catch(uploadError){console.warn('Canonical upload failed:',uploadError?.message||uploadError)}
    if(canonicalUrl) image=await generate(makePrompt(i)+'\n\nThe attached canonical image is the authoritative design. Reproduce that exact object and change only the camera.',[canonicalUrl],apiKey);
    else image=await fallback(makePrompt(i)+'\n\nIMPORTANT: reproduce the exact canonical physical object; do not redesign it.',apiKey);
   }
   images.push(image);
  }
  return response.status(200).json({images,referenceCount:refs.length,identityLocked:true,viewMode:'canonical-edit'});
 }catch(err){console.error('Pollinations error',err);return response.status(500).json({error:'Ошибка генерации: '+(err?.message||String(err))})}
}
