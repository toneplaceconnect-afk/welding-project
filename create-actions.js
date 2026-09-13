(() => {
  const style = document.createElement('style');
  style.textContent = `
    .create-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
    .create-action{border:1px solid #3b404b;background:#1b1e27;color:#fff;padding:11px 8px;cursor:pointer;font-size:8px;font-weight:800;letter-spacing:.04em}
    .create-action:hover{border-color:#cf2026;background:#20242e}
    .create-action:disabled{opacity:.45;cursor:not-allowed}
    .create-zoom{position:fixed;inset:0;background:rgba(5,7,10,.92);z-index:99999;display:none;align-items:center;justify-content:center;padding:30px;backdrop-filter:blur(8px)}
    .create-zoom.open{display:flex}
    .create-zoom img{max-width:92vw;max-height:88vh;object-fit:contain;box-shadow:0 20px 80px #000;transform-origin:center;cursor:grab;user-select:none}
    .create-zoom img.dragging{cursor:grabbing}
    .zoom-ui{position:fixed;top:18px;right:18px;display:flex;gap:7px;z-index:2}
    .zoom-ui button{border:1px solid #ffffff35;background:#151820;color:#fff;width:40px;height:40px;cursor:pointer;font-size:18px}
    .zoom-title{position:fixed;left:20px;top:22px;color:#fff;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    @media(max-width:560px){.create-actions{grid-template-columns:1fr 1fr}.create-zoom{padding:10px}.create-zoom img{max-width:98vw;max-height:82vh}}
  `;
  document.head.appendChild(style);

  const resultBoxes = () => [document.getElementById('r1'), document.getElementById('r2')];
  let zoom = null;
  let zoomImg = null;
  let zoomScale = 1;
  let zoomX = 0;
  let zoomY = 0;

  function getImages() {
    return resultBoxes().map(box => box?.querySelector('img')?.src || '').filter(Boolean);
  }

  function brief() {
    const get = id => document.getElementById(id)?.textContent?.trim() || '';
    return [
      'Проект-Сварка — визуализация изделия',
      `Изделие: ${get('sProduct')}`,
      `Размер: ${get('sSize')}`,
      `Материалы: ${get('sMaterial')}`,
      `Металл: ${get('sColor')}`,
      `Место: ${get('sPlace')}`,
      '',
      'Эскизы созданы на странице «Создай своё».'
    ].join('\n');
  }

  async function dataUrlToFile(url, name) {
    if (!url.startsWith('data:')) return null;
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || 'image/png' });
  }

  async function shareImages() {
    const imgs = getImages();
    if (!imgs.length) return alert('Сначала создайте визуализации.');
    const files = [];
    for (let i = 0; i < imgs.length; i++) {
      const f = await dataUrlToFile(imgs[i], `proekt-svarka-${i + 1}.png`);
      if (f) files.push(f);
    }
    if (navigator.share && files.length && (!navigator.canShare || navigator.canShare({ files }))) {
      await navigator.share({ title: 'Проект-Сварка', text: brief(), files });
      return;
    }
    const text = encodeURIComponent(brief());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(location.origin + location.pathname)}&text=${text}`, '_blank', 'noopener');
  }

  function emailImages() {
    const imgs = getImages();
    if (!imgs.length) return alert('Сначала создайте визуализации.');
    const subject = encodeURIComponent('Проект-Сварка — визуализация изделия');
    const body = encodeURIComponent(brief() + '\n\nЭскизы можно скачать кнопкой «Скачать».');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function downloadOne(src, index) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `proekt-svarka-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadAll() {
    const imgs = getImages();
    if (!imgs.length) return alert('Сначала создайте визуализации.');
    imgs.forEach((src, i) => setTimeout(() => downloadOne(src, i), i * 250));
  }

  function applyZoom() {
    if (!zoomImg) return;
    zoomImg.style.transform = `translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`;
  }

  function openZoom(src, title) {
    if (!zoom) {
      zoom = document.createElement('div');
      zoom.className = 'create-zoom';
      zoom.innerHTML = `<div class="zoom-title"></div><div class="zoom-ui"><button type="button" data-z="out">−</button><button type="button" data-z="reset">100%</button><button type="button" data-z="in">+</button><button type="button" data-z="close">×</button></div><img draggable="false" alt="Увеличенная визуализация">`;
      document.body.appendChild(zoom);
      zoomImg = zoom.querySelector('img');
      zoom.addEventListener('click', e => { if (e.target === zoom) closeZoom(); });
      zoom.querySelector('[data-z="close"]').onclick = closeZoom;
      zoom.querySelector('[data-z="out"]').onclick = () => { zoomScale = Math.max(.5, zoomScale - .25); applyZoom(); };
      zoom.querySelector('[data-z="in"]').onclick = () => { zoomScale = Math.min(4, zoomScale + .25); applyZoom(); };
      zoom.querySelector('[data-z="reset"]').onclick = () => { zoomScale = 1; zoomX = zoomY = 0; applyZoom(); };
      let dragging = false, sx = 0, sy = 0;
      zoomImg.addEventListener('mousedown', e => { dragging = true; sx = e.clientX - zoomX; sy = e.clientY - zoomY; zoomImg.classList.add('dragging'); });
      window.addEventListener('mousemove', e => { if (!dragging) return; zoomX = e.clientX - sx; zoomY = e.clientY - sy; applyZoom(); });
      window.addEventListener('mouseup', () => { dragging = false; zoomImg.classList.remove('dragging'); });
      zoomImg.addEventListener('wheel', e => { e.preventDefault(); zoomScale = Math.max(.5, Math.min(4, zoomScale + (e.deltaY < 0 ? .2 : -.2))); applyZoom(); }, { passive:false });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });
    }
    zoom.querySelector('.zoom-title').textContent = title || 'Визуализация';
    zoomImg.src = src;
    zoomScale = 1; zoomX = zoomY = 0; applyZoom();
    zoom.classList.add('open');
  }

  function closeZoom() { if (zoom) zoom.classList.remove('open'); }

  function mount() {
    const results = document.querySelector('.results');
    if (!results || results.dataset.actionsMounted) return;
    results.dataset.actionsMounted = '1';
    const actions = document.createElement('div');
    actions.className = 'create-actions';
    actions.innerHTML = `<button class="create-action" data-act="download">↓ СКАЧАТЬ</button><button class="create-action" data-act="tg">↗ В TELEGRAM</button><button class="create-action" data-act="mail">✉ НА ПОЧТУ</button><button class="create-action" data-act="zoom">⌕ УВЕЛИЧИТЬ</button>`;
    results.after(actions);
    actions.querySelector('[data-act="download"]').onclick = downloadAll;
    actions.querySelector('[data-act="tg"]').onclick = () => shareImages().catch(() => {});
    actions.querySelector('[data-act="mail"]').onclick = emailImages;
    actions.querySelector('[data-act="zoom"]').onclick = () => { const first = getImages()[0]; if (first) openZoom(first, 'Визуализация 1'); else alert('Сначала создайте визуализации.'); };

    resultBoxes().forEach((box, i) => {
      if (!box) return;
      box.addEventListener('click', () => { const img = box.querySelector('img'); if (img) openZoom(img.src, `Визуализация ${i + 1}`); });
      box.style.cursor = 'zoom-in';
    });
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.body, { childList:true, subtree:true });
  mount();
})();
