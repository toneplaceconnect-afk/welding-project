(() => {
  let zoom = null;
  let zoomImg = null;
  let zoomScale = 1;
  let zoomX = 0;
  let zoomY = 0;

  function getImage() {
    return document.querySelector('#r1 img')?.src || '';
  }

  function applyZoom() {
    if (zoomImg) zoomImg.style.transform = `translate(${zoomX}px,${zoomY}px) scale(${zoomScale})`;
  }

  function closeZoom() {
    if (zoom) zoom.classList.remove('open');
    document.body.classList.remove('zoom-open');
  }

  function openZoom(src) {
    if (!src) return alert('Сначала создайте визуализацию.');
    if (!zoom) {
      zoom = document.createElement('div');
      zoom.className = 'create-zoom';
      zoom.innerHTML = `<div class="zoom-title">Визуализация</div><div class="zoom-ui"><button type="button" data-z="out">−</button><button type="button" data-z="reset">100%</button><button type="button" data-z="in">+</button><button type="button" data-z="close">×</button></div><img draggable="false" alt="Увеличенная визуализация">`;
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
      let touchDragging = false, touchSX = 0, touchSY = 0, pinchDist = 0;
      zoomImg.addEventListener('touchstart', e => { if (e.touches.length === 1) { touchDragging = true; touchSX = e.touches[0].clientX - zoomX; touchSY = e.touches[0].clientY - zoomY; } else if (e.touches.length === 2) { touchDragging = false; const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; pinchDist = Math.hypot(dx, dy); } }, { passive: true });
      zoomImg.addEventListener('touchmove', e => { e.preventDefault(); if (e.touches.length === 1 && touchDragging) { zoomX = e.touches[0].clientX - touchSX; zoomY = e.touches[0].clientY - touchSY; applyZoom(); } else if (e.touches.length === 2 && pinchDist > 0) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const dist = Math.hypot(dx, dy); zoomScale = Math.max(.5, Math.min(4, zoomScale * (dist / pinchDist))); pinchDist = dist; applyZoom(); } }, { passive: false });
      zoomImg.addEventListener('touchend', () => { touchDragging = false; pinchDist = 0; }, { passive: true });
      zoomImg.addEventListener('wheel', e => { e.preventDefault(); zoomScale = Math.max(.5, Math.min(4, zoomScale + (e.deltaY < 0 ? .2 : -.2))); applyZoom(); }, { passive: false });
    }
    zoomImg.src = src;
    zoomScale = 1;
    zoomX = zoomY = 0;
    applyZoom();
    zoom.classList.add('open');
    document.body.classList.add('zoom-open');
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  function brief() {
    const text = document.getElementById('description')?.value?.trim() || '';
    return ['Проект-Сварка — визуализация изделия', '', text].join('\n');
  }

  async function dataUrlToFile(url, name) {
    if (!url.startsWith('data:')) return null;
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || 'image/png' });
  }

  async function shareImage() {
    const src = getImage();
    if (!src) return alert('Сначала создайте визуализацию.');
    const file = await dataUrlToFile(src, 'proekt-svarka-visualization.png');
    if (navigator.share && file && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: 'Проект-Сварка', text: brief(), files: [file] });
      return;
    }
    const text = encodeURIComponent(brief());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(location.origin + location.pathname)}&text=${text}`, '_blank', 'noopener');
  }

  function emailImage() {
    const src = getImage();
    if (!src) return alert('Сначала создайте визуализацию.');
    const subject = encodeURIComponent('Проект-Сварка — визуализация изделия');
    const body = encodeURIComponent(brief() + '\n\nВизуализацию можно скачать на странице «Создай своё».');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function downloadImage() {
    const src = getImage();
    if (!src) return alert('Сначала создайте визуализацию.');
    const a = document.createElement('a');
    a.href = src;
    a.download = 'proekt-svarka-visualization.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function mount() {
    const result = document.querySelector('#r1');
    if (!result || result.dataset.actionsMounted) return;
    result.dataset.actionsMounted = '1';

    const actions = document.createElement('div');
    actions.className = 'create-actions';
    actions.innerHTML = `<button class="create-action" data-act="download">↓ СКАЧАТЬ</button><button class="create-action" data-act="tg">↗ В TELEGRAM</button><button class="create-action" data-act="mail">✉ НА ПОЧТУ</button><button class="create-action" data-act="zoom">⌕ УВЕЛИЧИТЬ</button>`;
    result.parentNode.insertBefore(actions, result.nextSibling);

    actions.querySelector('[data-act="download"]').onclick = downloadImage;
    actions.querySelector('[data-act="tg"]').onclick = () => shareImage().catch(() => {});
    actions.querySelector('[data-act="mail"]').onclick = emailImage;
    actions.querySelector('[data-act="zoom"]').onclick = () => openZoom(getImage());

    result.addEventListener('click', () => {
      const src = getImage();
      if (src) openZoom(src);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();