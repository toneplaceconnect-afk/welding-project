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
    const dirTexts = document.querySelectorAll('#napravleniya ~ div p, #napravleniya + div + div p');
    if (p.directions) {
      p.directions.forEach((d, i) => {
        if (dirTitles[i]) dirTitles[i].textContent = d.title;
        const img = document.querySelector(`#dir-${i + 1}`);
        if (img && d.image) img.src = d.image;
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
      if (heroImg) heroImg.src = p.hero_image;
    }
    if (p.products) {
      const cards = document.querySelectorAll('[id^="loft-"]');
      p.products.forEach((prod, i) => {
        const card = document.querySelector(`#loft-${i + 1}`);
        if (card) {
          const parent = card.closest('div');
          if (parent) {
            const h3 = parent.querySelector('h3');
            const desc = parent.querySelector('p');
            if (h3) h3.textContent = prod.title;
            if (desc) desc.textContent = prod.text;
          }
        }
        if (prod.image) {
          const img = document.querySelector(`#loft-${i + 1}`);
          if (img) img.src = prod.image;
        }
      });
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

  function applyPage(pageId) {
    if (!CMS || !CMS.pages) return;
    applyGlobal(CMS.global);
    const page = CMS.pages[pageId];
    const applyFns = { home: applyHome, loft: applyLoft, prices: applyPrices, create: applyCreate };
    if (applyFns[pageId]) applyFns[pageId](page);
  }

  async function init() {
    const pageId = getPageId();
    try {
      const r = await fetch('/content.json?t=' + Date.now());
      if (!r.ok) return;
      CMS = await r.json();
      if (pageId) applyPage(pageId);
      applyGlobal(CMS.global);
      if (CMS.galleryImages) {
        Object.entries(CMS.galleryImages).forEach(([id, images]) => {
          const slot = document.getElementById(id);
          if (slot && images && images.length > 0) {
            slot.setAttribute('src', images[0]);
            if (images.length > 1) slot.setAttribute('data-images', JSON.stringify(images));
          }
        });
      }
    } catch (e) {
      console.warn('CMS loader: failed to load content.json', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
