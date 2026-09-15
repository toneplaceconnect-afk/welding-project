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
      const grid = document.getElementById('katalog-products');
      if (grid) {
        grid.innerHTML = p.products.map(item => `
          <article class="card" data-reveal style="background:#fff;box-shadow:0 10px 34px rgba(10,12,18,.1);overflow:hidden;transition:transform .3s,box-shadow .3s" style-hover="transform:translateY(-4px);box-shadow:0 16px 40px rgba(10,12,18,.16)">
            <div style="height:180px">${item.image ? `<img src="${item.image}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;background:#e6e8ee;display:flex;align-items:center;justify-content:center;color:#8d92a3;font-size:11px">Нет фото</div>`}</div>
            <div style="padding:20px">
              <h3 style="font-size:12.5px;font-weight:700;margin:0 0 8px;line-height:1.5">${item.title || ''}</h3>
              <p style="font-size:10.5px;color:#6a6f80;margin:0;line-height:1.9">${item.text || ''}</p>
              <p style="font-size:9.5px;color:#cf2026;font-weight:700;margin:14px 0 0;letter-spacing:.06em;text-transform:uppercase">${item.price || 'Цена по договорённости'}</p>
            </div>
          </article>
        `).join('');
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
