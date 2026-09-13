(() => {
  const init = () => {
    const results = [document.getElementById('r1'), document.getElementById('r2')].filter(Boolean);
    const status = document.getElementById('status');
    if (!results.length || document.body.dataset.createToolsReady) return;
    document.body.dataset.createToolsReady = '1';

    const style = document.createElement('style');
    style.textContent = `
      .result-tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
      .result-tools button{border:1px solid #3b404b;background:#1b1e27;color:#fff;padding:8px 9px;font-size:8px;font-weight:700;cursor:pointer}
      .result-tools button:hover{border-color:#cf2026;color:#fff}
      .result-wrap{min-width:0}
      .result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .result-actions button{border:1px solid #3b404b;background:#1b1e27;color:#fff;padding:11px 13px;font-size:8px;font-weight:800;cursor:pointer}
      .result-actions button:hover{border-color:#cf2026}
      .sketch-lightbox{position:fixed;inset:0;background:rgba(5,7,10,.94);z-index:99999;display:none;align-items:center;justify-content:center;padding:30px;backdrop-filter:blur(8px)}
      .sketch-lightbox.open{display:flex}
      .sketch-lightbox img{max-width:92vw;max-height:86vh;width:auto;height:auto;object-fit:contain;box-shadow:0 20px 70px #000;transform-origin:center;cursor:grab;user-select:none}
      .sketch-lightbox img.dragging{cursor:grabbing}
      .sketch-lightbox .close{position:absolute;right:20px;top:16px;border:1px solid #ffffff35;background:#151820;color:#fff;width:42px;height:42px;border-radius:50%;font-size:22px;cursor:pointer;z-index:2}
      .zoom-controls{position:absolute;right:72px;top:17px;display:flex;gap:7px;z-index:2}
      .zoom-controls button{border:1px solid #ffffff35;background:#151820;color:#fff;width:42px;height:42px;cursor:pointer;font-size:17px}
      .zoom-title{position:absolute;left:20px;top:30px;color:#fff;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      @media(max-width:560px){.sketch-lightbox{padding:10px}.sketch-lightbox img{max-width:98vw;max-height:80vh}.zoom-title{top:16px;left:12px}.zoom-controls{right:58px;top:10px}.zoom-controls button{width:36px;height:36px}.sketch-lightbox .close{right:10px;top:10px;width:36px;height:36px}}
    `;
    document.head.appendChild(style);

    const lightbox = document.createElement('div');
    lightbox.className = 'sketch-lightbox';
    lightbox.innerHTML = '<div class="zoom-title"></div><div class="zoom-controls"><button data-zoom="out">−</button><button data-zoom="reset">100%</button><button data-zoom="in">+</button></div><button class="close" aria-label="Закрыть">×</button><img alt="Увеличенный эскиз" draggable="false">';
    document.body.appendChild(lightbox);
    const lightImg = lightbox.querySelector('img');
    let scale = 1, offsetX = 0, offsetY = 0, dragging = false, startX = 0, startY = 0;
    const apply = () => { lightImg.style.transform = `translate(${offsetX}px,${offsetY}px) scale(${scale})`; };
    const close = () => { lightbox.classList.remove('open'); scale=1; offsetX=offsetY=0; apply(); };
    lightbox.querySelector('.close').onclick = close;
    lightbox.onclick = e => { if (e.target === lightbox) close(); };
    lightbox.querySelector('[data-zoom="out"]').onclick = () => { scale=Math.max(.5,scale-.25); apply(); };
    lightbox.querySelector('[data-zoom="in"]').onclick = () => { scale=Math.min(4,scale+.25); apply(); };
    lightbox.querySelector('[data-zoom="reset"]').onclick = () => { scale=1; offsetX=offsetY=0; apply(); };
    lightImg.addEventListener('wheel', e => { e.preventDefault(); scale=Math.max(.5,Math.min(4,scale+(e.deltaY<0?.2:-.2))); apply(); }, {passive:false});
    lightImg.addEventListener('mousedown', e => { dragging=true; startX=e.clientX-offsetX; startY=e.clientY-offsetY; lightImg.classList.add('dragging'); });
    window.addEventListener('mousemove', e => { if(!dragging)return; offsetX=e.clientX-startX; offsetY=e.clientY-startY; apply(); });
    window.addEventListener('mouseup', () => { dragging=false; lightImg.classList.remove('dragging'); });
    document.addEventListener('keydown', e => { if(e.key==='Escape') close(); });

    const getImage = box => box.querySelector('img');
    const download = (src,index) => { const a=document.createElement('a'); a.href=src; a.download=`proekt-svarka-sketch-${index+1}.png`; document.body.appendChild(a); a.click(); a.remove(); };
    const openZoom = (src,index) => { lightImg.src=src; lightImg.alt=`Увеличенный эскиз ${index+1}`; lightbox.querySelector('.zoom-title').textContent=`Визуализация ${index+1}`; scale=1; offsetX=offsetY=0; apply(); lightbox.classList.add('open'); };

    const addTools = (box,index) => {
      if(box.dataset.toolsAdded) return;
      box.dataset.toolsAdded='1';
      const wrap=document.createElement('div'); wrap.className='result-wrap'; box.parentNode.insertBefore(wrap,box); wrap.appendChild(box);
      const tools=document.createElement('div'); tools.className='result-tools'; tools.innerHTML='<button type="button" class="zoom">УВЕЛИЧИТЬ</button><button type="button" class="download">СКАЧАТЬ</button>'; wrap.appendChild(tools);
      tools.querySelector('.zoom').onclick=()=>{const img=getImage(box);if(img)openZoom(img.src,index)};
      tools.querySelector('.download').onclick=()=>{const img=getImage(box);if(img)download(img.src,index)};
      box.addEventListener('click',()=>{const img=getImage(box);if(img)openZoom(img.src,index)});
      box.style.cursor='zoom-in';
    };
    results.forEach(addTools);

    const actions=document.createElement('div'); actions.className='result-actions';
    actions.innerHTML='<button type="button" id="shareTg">ОТПРАВИТЬ В TELEGRAM</button><button type="button" id="shareMail">ОТПРАВИТЬ НА E-MAIL</button><button type="button" id="downloadAll">СКАЧАТЬ ЭСКИЗЫ</button>';
    const summary=document.querySelector('.summary'), confirm=document.getElementById('confirm');
    if(confirm)confirm.after(actions);else if(summary)summary.appendChild(actions);

    const getSummary=()=>['Заявка «Проект-Сварка»',`Изделие: ${document.getElementById('sProduct')?.textContent||''}`,`Размер: ${document.getElementById('sSize')?.textContent||''}`,`Материалы: ${document.getElementById('sMaterial')?.textContent||''}`,`Металл: ${document.getElementById('sColor')?.textContent||''}`,`Место: ${document.getElementById('sPlace')?.textContent||''}`,`Описание: ${document.getElementById('description')?.value||''}`].join('\n');
    document.getElementById('shareTg').onclick=()=>{const text=encodeURIComponent(getSummary());window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${text}`,'_blank','noopener');};
    document.getElementById('shareMail').onclick=()=>{const subject=encodeURIComponent('Заявка на изделие — Проект-Сварка');const body=encodeURIComponent(getSummary()+'\n\nЭскизы можно скачать со страницы: '+location.href);location.href=`mailto:?subject=${subject}&body=${body}`;};
    document.getElementById('downloadAll').onclick=()=>results.forEach((box,i)=>{const img=getImage(box);if(img)setTimeout(()=>download(img.src,i),i*250)});

    const observer=new MutationObserver(()=>results.forEach(addTools));
    results.forEach(box=>observer.observe(box,{childList:true,subtree:true}));
    window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
    if(status)status.dataset.toolsReady='1';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
