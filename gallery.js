(() => {
  'use strict';
  if (window.__GALLERY_LOADED__) return;
  window.__GALLERY_LOADED__ = true;

  const SCROLL_INTERVAL = 5000;
  let galleryId = 0;
  let galleryMap = {};

  function createZoom() {
    if (document.getElementById('gallery-zoom')) return;
    const z = document.createElement('div');
    z.id = 'gallery-zoom';
    z.innerHTML = `<div class="gz-title"></div><div class="gz-ui"><button data-gz="out">−</button><button data-gz="reset">100%</button><button data-gz="in">+</button><button data-gz="close">×</button></div><img draggable="false" alt="">`;
    document.body.appendChild(z);
    const img = z.querySelector('img');
    let scale = 1, tx = 0, ty = 0;
    function apply() { img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; }
    z.querySelector('[data-gz="close"]').onclick = () => { z.classList.remove('open'); document.body.classList.remove('gz-open'); };
    z.querySelector('[data-gz="out"]').onclick = () => { scale = Math.max(0.5, scale - 0.25); apply(); };
    z.querySelector('[data-gz="in"]').onclick = () => { scale = Math.min(4, scale + 0.25); apply(); };
    z.querySelector('[data-gz="reset"]').onclick = () => { scale = 1; tx = ty = 0; apply(); };
    z.onclick = e => { if (e.target === z) { z.classList.remove('open'); document.body.classList.remove('gz-open'); } };
    let drag = false, dsx = 0, dsy = 0;
    img.addEventListener('mousedown', e => { if (e.button !== 0) return; drag = true; dsx = e.clientX - tx; dsy = e.clientY - ty; img.classList.add('dragging'); });
    window.addEventListener('mousemove', e => { if (!drag) return; tx = e.clientX - dsx; ty = e.clientY - dsy; apply(); });
    window.addEventListener('mouseup', () => { drag = false; img.classList.remove('dragging'); });
    let tsx = 0, tsy = 0, pinchDist = 0;
    img.addEventListener('touchstart', e => { if (e.touches.length === 1) { tsx = e.touches[0].clientX - tx; tsy = e.touches[0].clientY - ty; } else if (e.touches.length === 2) { pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); } }, { passive: true });
    img.addEventListener('touchmove', e => { e.preventDefault(); if (e.touches.length === 1) { tx = e.touches[0].clientX - tsx; ty = e.touches[0].clientY - tsy; apply(); } else if (e.touches.length === 2 && pinchDist > 0) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); scale = Math.max(0.5, Math.min(4, scale * (d / pinchDist))); pinchDist = d; apply(); } }, { passive: false });
    img.addEventListener('touchend', () => { pinchDist = 0; }, { passive: true });
    img.addEventListener('wheel', e => { e.preventDefault(); scale = Math.max(0.5, Math.min(4, scale + (e.deltaY < 0 ? 0.2 : -0.2))); apply(); }, { passive: false });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { z.classList.remove('open'); document.body.classList.remove('gz-open'); } });
  }

  function openZoom(src, title) {
    const z = document.getElementById('gallery-zoom');
    if (!z) return;
    z.querySelector('img').src = src;
    z.querySelector('.gz-title').textContent = title || '';
    z.querySelector('img').style.transform = '';
    z.classList.add('open');
    document.body.classList.add('gz-open');
  }

  function buildGallery(container, images, title) {
    const id = 'g-' + (galleryId++);
    container.classList.add('gallery');
    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'gallery-track';
    track.id = id;
    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'gallery-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = title || '';
      img.loading = 'lazy';
      img.onclick = () => openZoom(src, title);
      slide.appendChild(img);
      track.appendChild(slide);
    });
    container.appendChild(track);
    if (images.length > 1) {
      const dots = document.createElement('div');
      dots.className = 'gallery-dots';
      images.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => { current = i; scrollTo(id, i); updateDots(id, i); };
        dots.appendChild(dot);
      });
      container.appendChild(dots);
      let current = 0;
      const intervalId = setInterval(() => {
        if (!document.getElementById(id)) { clearInterval(intervalId); return; }
        current = (current + 1) % images.length;
        scrollTo(id, current);
        updateDots(id, current);
      }, SCROLL_INTERVAL);
      container._galleryInterval = intervalId;
    }
    if (images.length > 1) {
      const counter = document.createElement('div');
      counter.className = 'gallery-counter';
      counter.textContent = `1 / ${images.length}`;
      container.appendChild(counter);
      container._counter = counter;
      container._total = images.length;
    }
  }

  function scrollTo(id, index) {
    const track = document.getElementById(id);
    if (!track) return;
    const slide = track.children[index];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  function updateDots(id, active) {
    const track = document.getElementById(id);
    if (!track) return;
    const container = track.parentElement;
    const dots = container.querySelectorAll('.gallery-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === active));
    const counter = container._counter;
    if (counter) counter.textContent = `${active + 1} / ${container._total}`;
  }

  function processSlots(root) {
    root.querySelectorAll('image-slot').forEach(slot => {
      if (slot.dataset.galleryDone) return;
      const id = slot.getAttribute('id');
      const src = slot.getAttribute('src');
      const imagesAttr = slot.getAttribute('data-images');
      let images = imagesAttr ? JSON.parse(imagesAttr) : null;
      if (!images && id && galleryMap[id]) images = galleryMap[id];
      if (!images && src) images = [src];
      if (!images || images.length <= 1) return;
      slot.dataset.galleryDone = '1';
      const title = slot.getAttribute('placeholder') || '';
      buildGallery(slot, images, title);
    });
  }

  async function init() {
    createZoom();
    try {
      const r = await fetch('/content.json?t=' + Date.now());
      if (r.ok) {
        const data = await r.json();
        galleryMap = data.galleryImages || {};
      }
    } catch (_) {}
    processSlots(document);

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) processSlots(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
