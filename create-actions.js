(() => {
  const style = document.createElement('style');
  style.textContent = `
    body, body * { font-family: 'Michroma','Unbounded','Inter',system-ui,sans-serif !important; }
    .hero h1{font-weight:700!important;letter-spacing:-.02em!important;line-height:1.12!important;max-width:920px!important}
    .hero p{font-size:15px!important;line-height:1.75!important;max-width:780px!important}
    .eyebrow{font-size:9px!important;letter-spacing:.18em!important}
    .flow{gap:25px!important}.flow b{font-size:9px!important}.flow span{font-size:8px!important}
    .layout{max-width:1240px!important;padding:28px!important;grid-template-columns:minmax(0,1.1fr) minmax(320px,.68fr)!important;gap:22px!important}
    .card{padding:28px!important;border-radius:0!important}.card h2{font-size:15px!important;letter-spacing:-.02em!important}
    .hint,.size-note{font-size:10px!important;line-height:1.7!important}.section{padding:21px 0!important}
    .label{font-size:9px!important;letter-spacing:.08em!important;margin-bottom:9px!important;color:#626876!important}
    .choices{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important}
    .choice{min-height:84px!important;padding:12px!important;border-radius:0!important}.choice .ico{font-size:20px!important;margin-bottom:7px!important}
    .choice strong{font-size:9px!important;line-height:1.35!important}.choice small{font-size:8px!important;line-height:1.35!important;margin-top:3px!important}
    .sizes{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}
    .size-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}
    .size-field label{font-size:9px!important;font-weight:700!important;color:#626876!important;text-transform:uppercase!important;letter-spacing:.08em!important}
    .size-field .input{font-size:12px!important;padding:12px 11px!important;height:46px!important;border-radius:0!important}
    .size-unit{font-size:8px!important;color:#777d8c!important;margin-top:-1px!important}
    .size-note{margin-top:9px!important;background:#fafbfc!important;border-left:2px solid #cf2026!important;padding:9px 11px!important}
    .materials{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important}
    .mat{min-height:84px!important;padding:12px!important;border-radius:0!important}.mat-mark{height:27px!important;margin-bottom:9px!important}
    .mat strong{font-size:9px!important;line-height:1.35!important}.mat small{font-size:8px!important;line-height:1.35!important}
    .colors{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:15px!important;align-items:start!important}
    .swatch{width:48px!important;height:48px!important;justify-self:center!important}.swatch span{top:55px!important;font-size:7px!important}.color-space{height:25px!important}
    .purpose{gap:8px!important}.pill{font-size:9px!important;padding:10px 13px!important;border-radius:0!important}
    .textarea{min-height:145px!important;font-size:12px!important;padding:12px 11px!important}.drop{padding:18px!important}
    .drop strong{font-size:10px!important}.drop p{font-size:8px!important;line-height:1.5!important}.drop input{font-size:9px!important}
    .summary{padding:20px!important;top:20px!important;border-radius:0!important}.summary h3{font-size:12px!important;letter-spacing:0!important}
    .summary-box{padding:15px!important}.summary-row{font-size:9px!important;padding:8px 0!important;align-items:flex-start!important}
    .summary-row b{font-weight:700!important;white-space:nowrap!important}.summary-row span{font-size:9px!important;line-height:1.35!important;max-width:58%!important}
    .summary-text{font-size:9px!important;line-height:1.65!important}.advanced{margin-top:14px!important;padding-top:13px!important}
    .advanced summary{font-size:9px!important}.node-head{font-size:9px!important;padding:10px!important}.node-body label{font-size:7px!important}.node-body input{font-size:9px!important}
    .checks{font-size:8px!important;line-height:1.7!important}.generate{font-size:10px!important;letter-spacing:0!important;padding:16px!important}
    .status{font-size:8px!important}.confirm{padding:14px!important}.confirm strong{font-size:9px!important}.confirm p{font-size:9px!important;line-height:1.6!important}
    .create-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important;margin-top:12px!important;align-items:stretch!important}
    .create-action{width:100%!important;min-width:0!important;min-height:42px!important;height:42px!important;margin:0!important;padding:0 8px!important;border:1px solid #dfe2e8!important;border-radius:0!important;background:#fff!important;color:#171a21!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;font-size:8px!important;font-weight:700!important;letter-spacing:.02em!important;line-height:1!important;box-sizing:border-box!important;cursor:pointer!important;appearance:none!important;-webkit-appearance:none!important}
    .create-action:hover{border-color:#cf2026!important;color:#cf2026!important;background:#fff!important}.create-action:focus-visible{outline:2px solid #cf2026!important;outline-offset:2px!important}
    .results{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.result{width:100%!important;min-width:0!important;aspect-ratio:4/3!important}
    @media(max-width:1050px){.layout{grid-template-columns:1fr!important}.summary{position:static!important}}
    @media(max-width:760px){.choices{grid-template-columns:repeat(2,minmax(0,1fr))!important}.materials{grid-template-columns:repeat(2,minmax(0,1fr))!important}.colors{grid-template-columns:repeat(3,minmax(0,1fr))!important}.sizes{grid-template-columns:repeat(2,minmax(0,1fr))!important}.size-field:last-child{grid-column:1/-1}.create-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:560px){.hero h1{font-size:27px!important}.hero p{font-size:13px!important}.flow{gap:13px!important}.layout{padding:14px!important}.card,.summary{padding:17px!important}.choices,.materials{grid-template-columns:1fr 1fr!important}.choice{min-height:80px!important;padding:11px!important}.choice strong{font-size:8px!important}.choice small{font-size:7px!important}.sizes{grid-template-columns:1fr 1fr!important}.colors{grid-template-columns:repeat(3,1fr)!important}.pill{font-size:8px!important}.textarea{min-height:145px!important}.create-actions{grid-template-columns:1fr!important}.create-action{height:42px!important}}
  `;
  document.head.appendChild(style);

  function improveSizeFields() {
    const sizes = document.querySelector('.sizes');
    if (!sizes || sizes.dataset.enhanced) return;
    const fields = [['Длина', 'Например, 1800', 'мм'],['Ширина', 'Например, 900', 'мм'],['Высота', 'Например, 750', 'мм']];
    const inputs = [...sizes.querySelectorAll('input')];
    inputs.forEach((input, i) => {
      const wrap = document.createElement('div'); wrap.className = 'size-field';
      const label = document.createElement('label'); label.textContent = fields[i]?.[0] || 'Размер';
      const unit = document.createElement('div'); unit.className = 'size-unit'; unit.textContent = fields[i]?.[2] || 'мм';
      input.placeholder = fields[i]?.[1] || 'Введите размер'; input.setAttribute('aria-label', fields[i]?.[0] || 'Размер');
      input.parentNode.insertBefore(wrap, input); wrap.appendChild(label); wrap.appendChild(input); wrap.appendChild(unit);
    });
    sizes.dataset.enhanced = '1';
  }

  improveSizeFields();
  const resultBoxes = () => [document.getElementById('r1'), document.getElementById('r2')];
  let zoom = null, zoomImg = null, zoomScale = 1, zoomX = 0, zoomY = 0;
  function getImages(){return resultBoxes().map(box => box?.querySelector('img')?.src || '').filter(Boolean)}
  function brief(){const get=id=>document.getElementById(id)?.textContent?.trim()||'';return ['Проект-Сварка — визуализация изделия',`Изделие: ${get('sProduct')}`,`Размер: ${get('sSize')}`,`Материалы: ${get('sMaterial')}`,`Металл: ${get('sColor')}`,`Место: ${get('sPlace')}`,'','Эскизы созданы на странице «Создай своё».'].join('\n')}
  async function dataUrlToFile(url,name){if(!url.startsWith('data:'))return null;const res=await fetch(url);const blob=await res.blob();return new File([blob],name,{type:blob.type||'image/png'})}
  async function shareImages(){const imgs=getImages();if(!imgs.length)return alert('Сначала создайте визуализации.');const files=[];for(let i=0;i<imgs.length;i++){const f=await dataUrlToFile(imgs[i],`proekt-svarka-${i+1}.png`);if(f)files.push(f)}if(navigator.share&&files.length&&(!navigator.canShare||navigator.canShare({files}))){await navigator.share({title:'Проект-Сварка',text:brief(),files});return}const text=encodeURIComponent(brief());window.open(`https://t.me/share/url?url=${encodeURIComponent(location.origin+location.pathname)}&text=${text}`,'_blank','noopener')}
  function emailImages(){const imgs=getImages();if(!imgs.length)return alert('Сначала создайте визуализации.');const subject=encodeURIComponent('Проект-Сварка — визуализация изделия');const body=encodeURIComponent(brief()+'\n\nЭскизы можно скачать кнопкой «Скачать».');window.location.href=`mailto:?subject=${subject}&body=${body}`}
  function downloadOne(src,index){const a=document.createElement('a');a.href=src;a.download=`proekt-svarka-${index+1}.png`;document.body.appendChild(a);a.click();a.remove()}
  function downloadAll(){const imgs=getImages();if(!imgs.length)return alert('Сначала создайте визуализации.');imgs.forEach((src,i)=>setTimeout(()=>downloadOne(src,i),i*250))}
  function applyZoom(){if(!zoomImg)return;zoomImg.style.transform=`translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`}
  function openZoom(src,title){if(!zoom){zoom=document.createElement('div');zoom.className='create-zoom';zoom.innerHTML=`<div class="zoom-title"></div><div class="zoom-ui"><button type="button" data-z="out">−</button><button type="button" data-z="reset">100%</button><button type="button" data-z="in">+</button><button type="button" data-z="close">×</button></div><img draggable="false" alt="Увеличенная визуализация">`;document.body.appendChild(zoom);zoomImg=zoom.querySelector('img');zoom.addEventListener('click',e=>{if(e.target===zoom)closeZoom()});zoom.querySelector('[data-z="close"]').onclick=closeZoom;zoom.querySelector('[data-z="out"]').onclick=()=>{zoomScale=Math.max(.5,zoomScale-.25);applyZoom()};zoom.querySelector('[data-z="in"]').onclick=()=>{zoomScale=Math.min(4,zoomScale+.25);applyZoom()};zoom.querySelector('[data-z="reset"]').onclick=()=>{zoomScale=1;zoomX=zoomY=0;applyZoom()};let dragging=false,sx=0,sy=0;zoomImg.addEventListener('mousedown',e=>{dragging=true;sx=e.clientX-zoomX;sy=e.clientY-zoomY;zoomImg.classList.add('dragging')});window.addEventListener('mousemove',e=>{if(!dragging)return;zoomX=e.clientX-sx;zoomY=e.clientY-sy;applyZoom()});window.addEventListener('mouseup',()=>{dragging=false;zoomImg.classList.remove('dragging')});zoomImg.addEventListener('wheel',e=>{e.preventDefault();zoomScale=Math.max(.5,Math.min(4,zoomScale+(e.deltaY<0?.2:-.2)));applyZoom()},{passive:false});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoom()})}zoom.querySelector('.zoom-title').textContent=title||'Визуализация';zoomImg.src=src;zoomScale=1;zoomX=zoomY=0;applyZoom();zoom.classList.add('open')}
  function closeZoom(){if(zoom)zoom.classList.remove('open')}
  function mount(){const results=document.querySelector('.results');if(!results||results.dataset.actionsMounted)return;results.dataset.actionsMounted='1';const actions=document.createElement('div');actions.className='create-actions';actions.innerHTML=`<button class="create-action" data-act="download">↓ СКАЧАТЬ</button><button class="create-action" data-act="tg">↗ В TELEGRAM</button><button class="create-action" data-act="mail">✉ НА ПОЧТУ</button><button class="create-action" data-act="zoom">⌕ УВЕЛИЧИТЬ</button>`;results.after(actions);actions.querySelector('[data-act="download"]').onclick=downloadAll;actions.querySelector('[data-act="tg"]').onclick=()=>shareImages().catch(()=>{});actions.querySelector('[data-act="mail"]').onclick=emailImages;actions.querySelector('[data-act="zoom"]').onclick=()=>{const first=getImages()[0];if(first)openZoom(first,'Визуализация 1');else alert('Сначала создайте визуализации.')};resultBoxes().forEach((box,i)=>{if(!box)return;box.addEventListener('click',()=>{const img=box.querySelector('img');if(img)openZoom(img.src,`Визуализация ${i+1}`)});box.style.cursor='zoom-in'})}
  const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});mount();
})();
