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

  // ---------- NATURAL-LANGUAGE INTENT ----------
  // The form starts with useful defaults. A plain-language description can override
  // untouched defaults, while an explicit user click always has priority.
  const PRODUCT_RULES = [
    { value: 'Беседка или пергола', re: /пергол\w*|pergola/i },
    { value: 'Беседка или пергола', re: /беседк\w*/i },
    { value: 'Навес или козырёк', re: /навес\w*|козыр[её]к\w*/i },
    { value: 'Забор, ворота, калитка', re: /забор\w*|ворот\w*|калитк\w*/i },
    { value: 'Лестница или перила', re: /лестниц\w*|перил\w*/i },
    { value: 'Мангальная зона', re: /мангал\w*|барбекю|\bbbq\b/i },
    { value: 'Стойка для бизнеса', re: /стойк\w*|ресепшн|барн\w* стойк/i },
    { value: 'Стеллаж', re: /стеллаж\w*|полк\w*|этажер\w*/i },
    { value: 'Скамья или табурет', re: /скамь\w*|табурет\w*|банкетк\w*/i },
    { value: 'Стол', re: /обеден\w* стол|\bстол\w*/i }
  ];
  const PLACE_RULES = [
    { value: 'Кафе / бар / магазин', re: /кафе|бар\b|ресторан|магазин|шоурум|ресепшн|коммерческ/i },
    { value: 'Гараж / мастерская', re: /гараж|мастерск|цех|производств/i },
    { value: 'Дача / участок', re: /дач\w*|участк\w*|улиц\w*|террас\w*|сад\w*|двор\b|беседк|пергол|навес\w*|мангал|барбекю/i },
    { value: 'Дом / интерьер', re: /дом\b|квартир\w*|интерьер|гостин\w*|кухн\w*|спальн\w*/i }
  ];
  const MATERIAL_RULES = [
    { value: 'Дерево + металл', re: /(дерев|деревян|массив|кедр|дуб|ясен|рейк|доск).*(металл|сталь|профил|каркас)|(?:металл|сталь|профил|каркас).*(дерев|деревян|массив|кедр|дуб|ясен|рейк|доск)/i },
    { value: 'Сталь / нержавейка', re: /нержав|нержавеющ|inox/i },
    { value: 'Металл', re: /металл|профильн\w* труб|профил\w* труб/i },
    { value: 'Дерево', re: /дерев\w*|массив|кедр|дуб|ясен|рейк|доск/i }
  ];
  const COLOR_RULES = [
    { value: 'Чёрный матовый', re: /ч[её]рн\w*|black|матов\w* ч[её]рн/i },
    { value: 'Графит', re: /графит/i },
    { value: 'Белый', re: /бел\w*/i },
    { value: 'Коричневый', re: /коричнев\w*|шоколад\w*/i },
    { value: 'Красный', re: /красн\w*/i },
    { value: 'Под сталь', re: /под сталь|серебрист\w*|металлик/i }
  ];

  function markManualChoices() {
    document.querySelectorAll('#products .choice, #materials .mat, #colors .swatch, #purpose .pill').forEach(btn => {
      if (btn.dataset.intentBound) return;
      btn.dataset.intentBound = '1';
      btn.addEventListener('click', () => { btn.dataset.userSelected = '1'; }, { capture: true });
    });
  }
  function hasManual(container) {
    return [...document.querySelectorAll(`${container} [data-user-selected="1"]`)].length > 0;
  }
  function chooseProduct(value) {
    if (hasManual('#products')) return;
    const btn = [...document.querySelectorAll('#products .choice')].find(x => x.dataset.value === value);
    if (btn) btn.click();
  }
  function chooseMaterial(value) {
    if (hasManual('#materials')) return;
    const btn = [...document.querySelectorAll('#materials .mat')].find(x => x.dataset.value === value);
    if (btn) btn.click();
  }
  function chooseColor(value) {
    if (hasManual('#colors')) return;
    const btn = [...document.querySelectorAll('#colors .swatch')].find(x => x.dataset.name === value);
    if (btn) btn.click();
  }
  function choosePlace(value) {
    if (hasManual('#purpose')) return;
    const btn = [...document.querySelectorAll('#purpose .pill')].find(x => x.textContent.trim() === value);
    if (btn) btn.click();
  }
  function parseDimensions(text) {
    const m = String(text || '').match(/\b(\d{3,5})\s*[xх×*]\s*(\d{3,5})\s*[xх×*]\s*(\d{3,5})\s*(?:мм|mm)?\b/i);
    return m ? [m[1], m[2], m[3]] : null;
  }
  function fillDimensionsFromText(text) {
    const values = parseDimensions(text);
    if (!values) return;
    ['width', 'depth', 'height'].forEach((id, i) => {
      const input = document.getElementById(id);
      if (input && !input.value.trim()) {
        input.value = values[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
  function applyNaturalLanguageIntent() {
    markManualChoices();
    const text = document.getElementById('description')?.value?.trim() || '';
    if (!text) return;
    const product = PRODUCT_RULES.find(x => x.re.test(text));
    if (product) chooseProduct(product.value);
    const place = PLACE_RULES.find(x => x.re.test(text));
    if (place) choosePlace(place.value);
    const material = MATERIAL_RULES.find(x => x.re.test(text));
    if (material) chooseMaterial(material.value);
    const color = COLOR_RULES.find(x => x.re.test(text));
    if (color) chooseColor(color.value);
    fillDimensionsFromText(text);
  }

  let zoom = null, zoomImg = null, zoomScale = 1, zoomX = 0, zoomY = 0;
  function applyZoom() { if (zoomImg) zoomImg.style.transform = `translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`; }
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
    markManualChoices();
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

  // Correct the structured state immediately before the page's inline generate handler runs.
  // Capture phase runs first, so the handler sends the corrected product/material/place to the API.
  document.addEventListener('click', e => {
    if (e.target?.closest?.('#generate')) applyNaturalLanguageIntent();
  }, true);

  const observer = new MutationObserver(() => {
    mount();
    const imgs = getImages();
    if (imgs.length >= 1) saveImages(imgs);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  improveSizeFields();
  mount();
  restoreImages();
})();
