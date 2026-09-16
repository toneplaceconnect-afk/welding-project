(() => {
  'use strict';
  if (window.__CMS_LOADED__) return;
  window.__CMS_LOADED__ = true;

  let CMS = null;

  const PAGE_MAP = {
    'Главная.dc.html': 'home',
    'Калькулятор.dc.html': 'calculator',
    'katalog.dc.html': 'loft',
    'Прайс.dc.html': 'prices',
    'Документация.dc.html': 'docs',
    'create.html': 'create'
  };

  function getPageId() {
    const file = decodeURIComponent(location.pathname.split('/').pop() || '');
    return PAGE_MAP[file] || null;
  }

  function setText(selector, text) {
    if (text == null || text === '') return;
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setHtml(selector, html) {
    if (html == null || html === '') return;
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function setAttr(selector, attr, value) {
    if (value == null || value === '') return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }

  function setSrc(selector, src) {
    if (!src) return;
    const el = document.querySelector(selector);
    if (el) el.src = src;
  }

  function applyGlobal(g) {
    if (!g) return;
    setText('.site-footer__bottom span:first-child', g.footerBottom);
    setText('.site-footer__grid > div:first-child p', g.footerDescription);
    setAttr('.site-header__phone', 'href', 'tel:' + g.phone);
    setAttr('a[href*="mailto:"]', 'href', 'mailto:' + g.email);
    const tgLinks = document.querySelectorAll('a[href*="t.me/welding_project"]');
    tgLinks.forEach(a => { a.href = g.telegramUrl; });
  }

  function applyHome(p) {
    if (!p) return;
    setText('section[style*="min-height"] h1', p.hero_title);
    const heroP = document.querySelector('section[style*="min-height"] p');
    if (heroP && p.hero_text) heroP.textContent = p.hero_text;
    if (p.hero_image) setSrc('#hero-photo', p.hero_image);

    const dirTitles = document.querySelectorAll('#napravleniya h3');
    if (p.directions) {
      p.directions.forEach((d, i) => {
        if (dirTitles[i]) dirTitles[i].textContent = d.title;
        const slot = document.querySelector(`#dir-${i + 1}`);
        if (slot) {
          if (d.images && d.images.length > 0) {
            slot.setAttribute('src', d.images[0]);
            slot.setAttribute('data-images', JSON.stringify(d.images));
          } else if (d.image) {
            slot.setAttribute('src', d.image);
          }
        }
      });
    }

    const loftItems = document.querySelectorAll('[id^="home-loft-"]');
    if (p.loft_items) {
      p.loft_items.forEach((item, i) => {
        const slot = document.querySelector(`#home-loft-${i + 1}`);
        if (slot) {
          if (item.images && item.images.length > 0) {
            slot.setAttribute('src', item.images[0]);
            slot.setAttribute('data-images', JSON.stringify(item.images));
          } else if (item.image) {
            slot.setAttribute('src', item.image);
          }
        }
      });
    }
  }

  function applyLoft(p) {
    if (!p) return;
    setText('section[style*="min-height"] h1', p.hero_title);
    const heroP = document.querySelector('section[style*="min-height"] p');
    if (heroP && p.hero_text) heroP.textContent = p.hero_text;
    if (p.hero_image) {
      const heroImg = document.querySelector('#loft-hero');
      if (heroImg) heroImg.setAttribute('src', p.hero_image);
    }
    setText('#loft-why-title', p.why_title);
    setText('#loft-why-text', p.why_text);
    setAttr('#loft-why-cta', 'href', p.why_cta_href);
    setText('#loft-why-cta', p.why_cta);
    setText('#loft-products-eyebrow', p.products_eyebrow);
    setText('#loft-products-title', p.products_title);
    setText('#loft-products-text', p.products_text);
    setText('#loft-process-title', p.process_title);
    setText('#loft-process-text', p.process_text);
    if (p.process_steps) {
      const ol = document.getElementById('loft-process-steps');
      if (ol) ol.innerHTML = p.process_steps.map(s => '<li>' + s + '</li>').join('');
    }
    setAttr('#loft-process-cta1', 'href', p.process_cta1_href);
    setText('#loft-process-cta1', p.process_cta1);
    setAttr('#loft-process-cta2', 'href', p.process_cta2_href);
    setText('#loft-process-cta2', p.process_cta2);
    if (p.products) {
      const grid = document.getElementById('katalog-products');
      if (grid) {
        const cards = grid.querySelectorAll('article');
        p.products.forEach((item, i) => {
          if (!cards[i]) return;
          const h3 = cards[i].querySelector('h3');
          if (h3) h3.textContent = item.title || '';
          const ps = cards[i].querySelectorAll('p');
          if (ps[0]) ps[0].textContent = item.text || '';
          if (ps[1]) ps[1].textContent = item.price || 'Цена по договорённости';
          function normUrl(u) {
            if (!u) return '';
            const m = u.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)/);
            return m ? m[1] : u;
          }
          let images = [];
          const img = normUrl(item.image);
          if (img) images.push(img);
          if (item.images) item.images.forEach(src => { const n = normUrl(src); if (n && !images.includes(n)) images.push(n); });
          const slot = cards[i].querySelector('image-slot');
          if (slot && images.length > 0) {
            slot.setAttribute('src', images[0]);
            if (images.length > 1) slot.setAttribute('data-images', JSON.stringify(images));
          } else if (!slot && images.length === 1) {
            const imgEl = cards[i].querySelector('div > img');
            if (imgEl) imgEl.src = images[0];
          }
        });
        grid.querySelectorAll('[data-reveal]').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.94) el.classList.add('in');
        });
      }
    }
  }

  function applyPrices(p) {
    if (!p) return;
    setText('section[style*="min-height"] h1', p.hero_title);
  }

  function applyCreate(p) {
    if (!p) return;
    setText('.hero h1', p.hero_title);
    setText('.hero p', p.hero_text);
    setText('.card h2', p.card_title);
    setText('.hint', p.hint);
    setText('.label', p.field_label);
    setAttr('.textarea', 'placeholder', p.placeholder);
    setText('.drop strong', p.drop_title);
    setText('.drop p', p.drop_text);
    setText('.generate', p.submit_text);
  }

  function applyGalleryImages() {
    if (!CMS || !CMS.galleryImages) return;
    Object.entries(CMS.galleryImages).forEach(([id, images]) => {
      const slot = document.getElementById(id);
      if (slot && images && images.length > 0) {
        slot.setAttribute('src', images[0]);
        if (images.length > 1) slot.setAttribute('data-images', JSON.stringify(images));
      }
    });
  }

  function applyAll() {
    if (!CMS) return;
    const pageId = getPageId();
    if (pageId) applyPage(pageId);
    applyGlobal(CMS.global);
    applyGalleryImages();
    if (window.__galleryRescan) window.__galleryRescan();
  }

  window.__applyCMS = applyAll;

  async function loadContent() {
    try {
      const r = await fetch('/content.json?t=' + Date.now());
      if (!r.ok) return;
      CMS = await r.json();
      window.__CMS_DATA__ = CMS;
    } catch (e) {
      console.warn('CMS loader: failed to load content.json', e);
    }
  }

  const start = async () => {
    await loadContent();
    applyAll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
