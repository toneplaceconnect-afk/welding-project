(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* Readability / layout layer for the guided Create page. */
    body,
    button,input,textarea,
    .navlinks,.phone,.hero p,.flow,.card,.hint,.size-note,
    .choice,.choice strong,.choice small,.mat,.mat strong,.mat small,
    .label,.pill,.drop,.drop strong,.drop p,.summary,.summary-row,
    .summary-text,.checks,.status,.confirm,.confirm p {
      font-family: Inter, Arial, Helvetica, sans-serif !important;
    }

    .hero h1,.brand,.eyebrow,.card h2,.summary h3,.generate {
      font-family: Inter, Arial, Helvetica, sans-serif !important;
    }
    .hero h1{font-weight:800!important;letter-spacing:-.035em!important;line-height:1.08!important;max-width:920px!important}
    .hero p{font-size:14px!important;line-height:1.65!important;max-width:820px!important}
    .eyebrow{font-size:10px!important;letter-spacing:.14em!important}
    .flow{gap:34px!important}
    .flow b{font-size:10px!important}
    .flow span{font-size:9px!important}

    .layout{grid-template-columns:minmax(0,1.55fr) minmax(330px,.85fr)!important;gap:24px!important;max-width:1280px!important;padding:32px 24px!important}
    .card{padding:30px!important;border-radius:2px!important}
    .card h2{font-size:20px!important;letter-spacing:-.02em!important}
    .hint,.size-note{font-size:12px!important;line-height:1.55!important}
    .section{padding:26px 0!important}
    .label{font-size:11px!important;letter-spacing:.055em!important;margin-bottom:13px!important;color:#3f4653!important}

    .choices{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
    .choice{min-height:96px!important;padding:15px!important;border-radius:2px!important}
    .choice .ico{font-size:22px!important;margin-bottom:10px!important}
    .choice strong{font-size:12px!important;line-height:1.25!important}
    .choice small{font-size:10px!important;line-height:1.35!important;margin-top:5px!important}

    .sizes{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}
    .size-field{display:flex!important;flex-direction:column!important;gap:7px!important;min-width:0!important}
    .size-field label{font-size:11px!important;font-weight:700!important;color:#454c58!important}
    .size-field .input{font-size:14px!important;padding:13px 12px!important;height:48px!important}
    .size-unit{font-size:10px!important;color:#8a909b!important;margin-top:-2px!important}
    .size-note{margin-top:12px!important;background:#f6f7f9!important;border-left:3px solid #cf2026!important;padding:10px 12px!important}

    .materials{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
    .mat{min-height:86px!important;padding:14px!important;border-radius:2px!important}
    .mat-mark{height:34px!important;margin-bottom:10px!important}
    .mat strong{font-size:11px!important}
    .mat small{font-size:10px!important}

    .colors{display:grid!important;grid-template-columns:repeat(6,minmax(56px,1fr))!important;gap:14px!important;align-items:start!important}
    .swatch{width:44px!important;height:44px!important;justify-self:center!important}
    .swatch span{top:51px!important;font-size:8px!important}
    .color-space{height:22px!important}

    .purpose{gap:8px!important}
    .pill{font-size:11px!important;padding:10px 13px!important;border-radius:2px!important}

    .textarea{min-height:170px!important;font-size:13px!important;padding:14px!important}
    .drop{padding:22px!important}
    .drop strong{font-size:12px!important}
    .drop p{font-size:11px!important;line-height:1.5!important}
    .drop input{font-size:11px!important}

    .summary{padding:24px!important;top:24px!important;border-radius:2px!important}
    .summary h3{font-size:14px!important;letter-spacing:.04em!important}
    .summary-box{padding:17px!important}
    .summary-row{font-size:11px!important;padding:11px 0!important;align-items:flex-start!important}
    .summary-row b{font-weight:700!important;white-space:nowrap!important}
    .summary-row span{font-size:11px!important;line-height:1.35!important;max-width:58%!important}
    .summary-text{font-size:11px!important;line-height:1.65!important}
    .advanced{margin-top:18px!important;padding-top:16px!important}
    .advanced summary{font-size:11px!important}
    .node-head{font-size:11px!important;padding:12px!important}
    .node-body label{font-size:9px!important}
    .node-body input{font-size:10px!important}
    .checks{font-size:10px!important;line-height:1.8!important}
    .generate{font-size:11px!important;letter-spacing:.02em!important;padding:17px!important}
    .status{font-size:10px!important}
    .confirm{padding:16px!important}
    .confirm strong{font-size:11px!important}
    .confirm p{font-size:10px!important;line-height:1.55!important}

    .create-actions{grid-template-columns:repeat(2,1fr)!important;gap:9px!important;margin-top:12px!important}
    .create-action{font-family:Inter,Arial,sans-serif!important;font-size:10px!important;padding:12px 8px!important}

    @media(max-width:1050px){
      .layout{grid-template-columns:1fr!important}
      .summary{position:static!important}
    }
    @media(max-width:760px){
      .choices{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .colors{grid-template-columns:repeat(3,minmax(56px,1fr))!important}
      .sizes{grid-template-columns:1fr 1fr!important}
      .size-field:last-child{grid-column:1/-1}
    }
    @media(max-width:560px){
      .hero h1{font-size:30px!important}
      .hero p{font-size:13px!important}
      .flow{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important}
      .layout{padding:16px 12px!important}
      .card,.summary{padding:18px!important}
      .choices,.materials{grid-template-columns:1fr 1fr!important}
      .choice{min-height:86px!important;padding:12px!important}
      .choice strong{font-size:11px!important}
      .choice small{font-size:9px!important}
      .sizes{grid-template-columns:1fr 1fr!important}
      .colors{grid-template-columns:repeat(3,1fr)!important}
      .pill{font-size:10px!important}
      .textarea{min-height:145px!important}
    }
  `;
  document.head.appendChild(style);

  function improveSizeFields() {
    const sizes = document.querySelector('.sizes');
    if (!sizes || sizes.dataset.enhanced) return;
    const fields = [
      ['Длина', 'Например, 1800', 'мм'],
      ['Ширина', 'Например, 900', 'мм'],
      ['Высота', 'Например, 750', 'мм']
    ];
    const inputs = [...sizes.querySelectorAll('input')];
    inputs.forEach((input, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'size-field';
      const label = document.createElement('label');
      label.textContent = fields[i]?.[0] || 'Размер';
      const unit = document.createElement('div');
      unit.className = 'size-unit';
      unit.textContent = fields[i]?.[2] || 'мм';
      input.placeholder = fields[i]?.[1] || 'Введите размер';
      input.setAttribute('aria-label', fields[i]?.[0] || 'Размер');
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(label);
      wrap.appendChild(input);
      wrap.appendChild(unit);
    });
    sizes.dataset.enhanced = '1';
  }

  improveSizeFields();

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
