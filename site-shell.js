(() => {
  'use strict';
  if (window.__PROJECT_SVARKA_SITE_SHELL__) return;
  window.__PROJECT_SVARKA_SITE_SHELL__ = true;

  const PHONE = '+79831981588';
  const PHONE_FMT = '+7 983 198 15 88';
  const BRAND = 'ПРОЕКТ-СВАРКА';
  const DEF_NAV = [
    { href: 'Главная.dc.html', label: 'Главная' },
    { href: 'create.html', label: 'Создай своё' },
    { href: 'Калькулятор.dc.html', label: 'Калькулятор' },
    { href: 'katalog.dc.html', label: 'Каталог' },
    { href: 'Документация.dc.html', label: 'Документация' },
    { href: 'Прайс.dc.html', label: 'Цены' }
  ];
  const DEF_FOOTER_LINKS = [
    { href: 'Калькулятор.dc.html', label: 'Калькулятор материалов' },
    { href: 'katalog.dc.html', label: 'Каталог' },
    { href: 'Документация.dc.html', label: 'Документация' },
    { href: 'Прайс.dc.html', label: 'Цены' }
  ];
  const FLASH = '<span class="site-header__flash" aria-hidden="true"></span>';
  const brandHTML = (brand) => `<span class="site-header__brand-mark"><img src="assets/logo-mark.svg" alt="${brand}">${FLASH}</span><span class="site-brand-name">ПРОЕКТ<span class="site-brand-hyphen">-</span>СВАРКА</span>`;

  function renderShell(g) {
    if (!document.body) return;
    g = g || {};
    const brand = g.brand || BRAND;
    const phone = g.phone || PHONE;
    const phoneFmt = g.phoneFormatted || PHONE_FMT;
    const email = g.email || 'ProektSvarka@yandex.ru';
    const tg = g.telegram || '@welding_project';
    const tgUrl = g.telegramUrl || 'https://t.me/welding_project';
    const nav = (Array.isArray(g.nav) && g.nav.length ? g.nav : DEF_NAV).map(n => `<a href="${n.href}">${n.label}</a>`).join('');
    const flinks = (Array.isArray(g.footerLinks) && g.footerLinks.length ? g.footerLinks : DEF_FOOTER_LINKS).map(n => `<a href="${n.href}">${n.label}</a>`).join('');
    const bh = brandHTML(brand);
    const HEADER_HTML = `<header class="site-header"><nav class="site-header__nav"><a class="site-header__brand" href="Главная.dc.html" aria-label="${brand}">${bh}</a><button type="button" class="site-header__burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button><div class="site-header__links">${nav}</div><a class="site-header__phone" href="tel:${phone}" aria-label="Позвонить"><span class="site-header__phone-dot">☎</span><span class="site-header__phone-copy"><small>${g.callNow || 'ЗВОНИТЕ СЕЙЧАС'}</small><strong>${phoneFmt}</strong></span></a></nav></header>`;
    const FOOTER_HTML = `<footer class="site-footer"><div class="site-footer__grid"><div><a class="site-footer__brand" href="Главная.dc.html" aria-label="${brand}">${bh}</a><p>${g.footerDescription || 'Сварочные и инженерные работы в регионе. Расчёт по СП и ГОСТ, цена в договоре.'}</p></div><div><h3>${g.footerSections || 'Разделы'}</h3><div class="site-footer__links">${flinks}</div></div><div><h3>${g.footerContacts || 'Контакты'}</h3><div class="site-footer__links"><a href="tel:${phone}">${phoneFmt}</a><a href="${tgUrl}" target="_blank" rel="noopener">${tg}</a><a href="mailto:${email}">${email}</a><span>${g.footerRegion || 'Работаю по региону'}</span></div></div></div><div class="site-footer__bottom"><span>${g.footerBottom || (BRAND + '. Выезд и замер бесплатно.')}</span><a href="https://t.me/CompilePoint" target="_blank" rel="noopener"><img src="assets/logo-compilepoint-mark.png" alt="CompilePoint"><span>Разработано в «Точка Сборки»</span></a></div></footer>`;
    document.querySelectorAll('.site-header, footer, .site-top').forEach(node => node.remove());
    document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
    const top = document.createElement('button');
    top.type = 'button';
    top.className = 'site-top';
    top.setAttribute('aria-label', 'Наверх');
    top.title = 'Наверх';
    top.textContent = '↑';
    document.body.appendChild(top);
  }

  function setActive() {
    const current = decodeURIComponent(location.pathname.split('/').pop() || 'Главная.dc.html');
    document.querySelectorAll('.site-header__links a').forEach(a => {
      const href = decodeURIComponent((a.getAttribute('href') || '').split('/').pop() || '');
      a.classList.toggle('active', href === current || (!current && href === 'Главная.dc.html'));
    });
  }

  function updateScrollState() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    document.querySelector('.site-top')?.classList.toggle('is-visible', y > 180);
    document.querySelector('.site-header')?.classList.toggle('is-scrolled', y > 10);
  }

  function bind() {
    document.addEventListener('click', event => {
      const burger = event.target.closest('.site-header__burger');
      if (burger) {
        const links = document.querySelector('.site-header__links');
        const open = links?.classList.toggle('is-open') || false;
        burger.setAttribute('aria-expanded', String(open));
        return;
      }
      if (event.target.closest('.site-header__links a')) {
        document.querySelector('.site-header__links')?.classList.remove('is-open');
        document.querySelector('.site-header__burger')?.setAttribute('aria-expanded', 'false');
        return;
      }
      if (!event.target.closest('.site-header__links')) {
        document.querySelector('.site-header__links')?.classList.remove('is-open');
        document.querySelector('.site-header__burger')?.setAttribute('aria-expanded', 'false');
      }
      const top = event.target.closest('.site-top');
      if (top) window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', updateScrollState, { passive: true });
  }

  async function init() {
    let g = null;
    try {
      const r = await fetch('/content.json?t=' + Date.now());
      if (r.ok) { const j = await r.json(); g = j.global || null; }
    } catch (e) {}
    renderShell(g);
    setActive();
    bind();
    updateScrollState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
