(() => {
  const DB_NAME = 'proekt-svarka-create';
  const STORE = 'visualizations';
  const KEY = 'latest';

  function dbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveImages(images) {
    if (!images.length) return;
    try {
      const db = await dbOpen();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(images, KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (_) {}
  }

  async function loadImages() {
    try {
      const db = await dbOpen();
      const images = await new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return Array.isArray(images) ? images : [];
    } catch (_) { return []; }
  }

  function resultBoxes() { return [document.getElementById('r1'), document.getElementById('r2')]; }
  function getImages() { return resultBoxes().map(box => box?.querySelector('img')?.src || '').filter(Boolean); }

  async function restoreImages() {
    const images = await loadImages();
    if (!images.length) return;
    resultBoxes().forEach((box, i) => {
      if (!box || !images[i]) return;
      box.className = 'result';
      box.innerHTML = `<img src="${images[i]}" alt="Визуализация ${i + 1}">`;
    });
    const status = document.getElementById('status');
    if (status) status.textContent = 'Сохранённые визуализации восстановлены.';
    const confirm = document.getElementById('confirm');
    if (confirm) confirm.classList.add('show');
    mount();
  }

  function improveSizeFields() {
    const sizes = document.querySelector('.sizes');
    if (!sizes || sizes.dataset.enhanced) return;
    const fields = [['Длина', 'Например, 1800'], ['Ширина', 'Например, 900'], ['Высота', 'Например, 750']];
    [...sizes.querySelectorAll('input')].forEach((input, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'size-field';
      const label = document.createElement('label');
      label.textContent = fields[i]?.[0] || 'Размер';
      const unit = document.createElement('div');
      unit.className = 'size-unit';
      unit.textContent = 'мм';
      input.placeholder = fields[i]?.[1] || 'Введите размер';
      input.setAttribute('aria-label', label.textContent);
      input.parentNode.insertBefore(wrap, input);
      wrap.append(label, input, unit);
    });
    sizes.dataset.enhanced = '1';
  }

  // If the user describes the изделие in plain language but leaves the default
  // "Стол" selected, synchronize the structured product with the clear intent.
  // A manual product choice always wins; inference is only used while the default remains active.
  function setupIntentInference() {
    const description = document.getElementById('description');
    if (!description || description.dataset.intentBound) return;
    description.dataset.intentBound = '1';

    const productRules = [
      { value: 'Беседка или пергола', re: /(?:хочу|заказать|нужна|нужен|сделать|изготовить|построить)[^.!?\n]{0,90}(пергол|беседк)/i },
      { value: 'Навес или козырёк', re: /(?:хочу|заказать|нужен|нужна|сделать|изготовить)[^.!?\n]{0,90}(навес|козыр[её]к)/i },
      { value: 'Забор, ворота, калитка', re: /(?:хочу|заказать|нужен|нужна|сделать|изготовить)[^.!?\n]{0,90}(забор|ворот|калитк)/i },
      { value: 'Лестница или перила', re: /(?:хочу|заказать|нужна|нужен|сделать|изготовить)[^.!?\n]{0,90}(лестниц|перил)/i },
      { value: 'Мангальная зона', re: /(?:хочу|заказать|нужна|нужен|сделать|изготовить)[^.!?\n]{0,90}(мангал|барбекю|bbq)/i },
      { value: 'Стойка для бизнеса', re: /(?:хочу|заказать|нужна|нужен|сделать|изготовить)[^.!?\n]{0,90}(стойк|ресепш|барн[а-я]* сто)/i },
      { value: 'Стеллаж', re: /(?:хочу|заказать|нужен|нужна|сделать|изготовить)[^.!?\n]{0,90}(стеллаж|стеллажн|полк)/i },
      { value: 'Скамья или табурет', re: /(?:хочу|заказать|нужна|нужен|сделать|изготовить)[^.!?\n]{0,90}(скамь|табурет)/i }
    ];

    function syncIntent() {
      const text = description.value.trim();
      if (!text || typeof state === 'undefined' || state.product !== 'Стол') return;
      const rule = productRules.find(x => x.re.test(text));
      if (!rule) return;
      const button = [...document.querySelectorAll('#products .choice')].find(x => x.dataset.value === rule.value);
      if (!button) return;
      document.querySelectorAll('#products .choice').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      state.product = rule.value;
      if (typeof update === 'function') update();
    }

    description.addEventListener('input', syncIntent);
  }

  let zoom = null, zoomImg = null, zoomScale = 1, zoomX = 0, zoomY = 0;
  function applyZoom() {
    if (zoomImg) zoomImg.style.transform = `translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`;
  }
  function closeZoom() { if (zoom) zoom.classList.remove('open'); document.body.classList.remove('zoom-open'); }
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
      zoomImg.addEventListener('mousedown', e => { if (e.button !== 0) return; dragging = true; sx = e.clientX - zoomX; sy = e.clientY - zoomY; zoomImg.classList.add('dragging'); });
      window.addEventListener('mousemove', e => { if (!dragging) return; zoomX = e.clientX - sx; zoomY = e.clientY - sy; applyZoom(); });
      window.addEventListener('mouseup', () => { dragging = false; zoomImg.classList.remove('dragging'); });
      zoomImg.addEventListener('wheel', e => { e.preventDefault(); zoomScale = Math.max(.5, Math.min(4, zoomScale + (e.deltaY < 0 ? .2 : -.2))); applyZoom(); }, { passive: false });
    }
    zoom.querySelector('.zoom-title').textContent = title || 'Визуализация';
    zoomImg.src = src;
    zoomScale = 1; zoomX = zoomY = 0;
    applyZoom();
    zoom.classList.add('open');
    document.body.classList.add('zoom-open');
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  function brief() {
    const get = id => document.getElementById(id)?.textContent?.trim() || '';
    return ['Проект-Сварка — визуализация изделия', `Изделие: ${get('sProduct')}`, `Размер: ${get('sSize')}`, `Материалы: ${get('sMaterial')}`, `Металл: ${get('sColor')}`, `Место: ${get('sPlace')}`, '', 'Эскизы созданы на странице «Создай своё».'].join('\n');
  }
  async function dataUrlToFile(url, name) {
    if (!url.startsWith('data:')) return null;
    const res = await fetch(url); const blob = await res.blob();
    return new File([blob], name, { type: blob.type || 'image/png' });
  }
  async function shareImages() {
    const imgs = getImages();
    if (!imgs.length) return alert('Сначала создайте визуализации.');
    const files = [];
    for (let i = 0; i < imgs.length; i++) { const f = await dataUrlToFile(imgs[i], `proekt-svarka-${i + 1}.png`); if (f) files.push(f); }
    if (navigator.share && files.length && (!navigator.canShare || navigator.canShare({ files }))) { await navigator.share({ title: 'Проект-Сварка', text: brief(), files }); return; }
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
  function downloadOne(src, index) { const a = document.createElement('a'); a.href = src; a.download = `proekt-svarka-${index + 1}.png`; document.body.appendChild(a); a.click(); a.remove(); }
  function downloadAll() { const imgs = getImages(); if (!imgs.length) return alert('Сначала создайте визуализации.'); imgs.forEach((src, i) => setTimeout(() => downloadOne(src, i), i * 250)); }

  function mount() {
    const results = document.querySelector('.results');
    if (!results) return;
    if (!results.dataset.actionsMounted) {
      results.dataset.actionsMounted = '1';
      const actions = document.createElement('div');
      actions.className = 'create-actions';
      actions.innerHTML = `<button class="create-action" data-act="download">↓ СКАЧАТЬ</button><button class="create-action" data-act="tg">↗ В TELEGRAM</button><button class="create-action" data-act="mail">✉ НА ПОЧТУ</button><button class="create-action" data-act="zoom">⌕ УВЕЛИЧИТЬ</button>`;
      results.after(actions);
      actions.querySelector('[data-act="download"]').onclick = downloadAll;
      actions.querySelector('[data-act="tg"]').onclick = () => shareImages().catch(() => {});
      actions.querySelector('[data-act="mail"]').onclick = emailImages;
      actions.querySelector('[data-act="zoom"]').onclick = () => { const first = getImages()[0]; first ? openZoom(first, 'Визуализация 1') : alert('Сначала создайте визуализации.'); };
    }
    resultBoxes().forEach((box, i) => {
      if (!box || box.dataset.zoomBound) return;
      box.dataset.zoomBound = '1';
      box.addEventListener('click', () => { const img = box.querySelector('img'); if (img) openZoom(img.src, `Визуализация ${i + 1}`); });
      box.style.cursor = 'zoom-in';
    });
  }

  const observer = new MutationObserver(() => {
    mount();
    const imgs = getImages();
    if (imgs.length >= 1) saveImages(imgs);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  improveSizeFields();
  setupIntentInference();
  mount();
  restoreImages();
})();
