(() => {
  'use strict';
  if (window.__PROJECT_SVARKA_SITE_SHELL__) return;
  window.__PROJECT_SVARKA_SITE_SHELL__ = true;

  const PHONE = '+79831981588';
  const BRAND = 'ПРОЕКТ-СВАРКА';
  const FLASH = '<span class="site-header__flash" aria-hidden="true"></span>';
  const BRAND_HTML = `<span class="site-header__brand-mark"><img src="assets/logo-mark.svg" alt="${BRAND}">${FLASH}</span><span class="site-brand-name">ПРОЕКТ<span class="site-brand-hyphen">-</span>СВАРКА</span>`;
  const HEADER_HTML = `<header class="site-header"><nav class="site-header__nav"><a class="site-header__brand" href="Главная.dc.html" aria-label="${BRAND}">${BRAND_HTML}</a><button type="button" class="site-header__burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button><div class="site-header__links"><a href="Главная.dc.html">Главная</a><a href="create.html">Создай своё</a><a href="Калькулятор.dc.html">Калькулятор</a><a href="Лофт-мебель.dc.html">Лофт-мебель</a><a href="Документация.dc.html">Документация</a><a href="Прайс.dc.html">Цены</a></div><a class="site-header__phone" href="tel:${PHONE}" aria-label="Позвонить"><span class="site-header__phone-dot">☎</span><span class="site-header__phone-copy"><small>ЗВОНИТЕ СЕЙЧАС</small><strong>+7 983 198 15 88</strong></span></a></nav></header>`;
  const FOOTER_HTML = `<footer class="site-footer"><div class="site-footer__grid"><div><a class="site-footer__brand" href="Главная.dc.html" aria-label="${BRAND}">${BRAND_HTML}</a><p>Сварочные и инженерные работы в регионе. Расчёт по СП и ГОСТ, цена в договоре.</p></div><div><h3>Разделы</h3><div class="site-footer__links"><a href="Калькулятор.dc.html">Калькулятор материалов</a><a href="Лофт-мебель.dc.html">Лофт-мебель</a><a href="Документация.dc.html">Документация</a><a href="Прайс.dc.html">Цены</a></div></div><div><h3>Контакты</h3><div class="site-footer__links"><a href="tel:${PHONE}">+7 983 198 15 88</a><a href="https://t.me/welding_project" target="_blank" rel="noopener">@welding_project</a><a href="mailto:ProektSvarka@yandex.ru">ProektSvarka@yandex.ru</a><span>Работаю по региону</span></div></div></div><div class="site-footer__bottom"><span>${BRAND}. Выезд и замер бесплатно.</span><a href="https://t.me/CompilePoint" target="_blank" rel="noopener"><img src="assets/logo-compilepoint-mark.png" alt="CompilePoint"><span>Разработано в «Точка Сборки»</span></a></div></footer>`;

  function renderShell() {
    if (!document.body) return;
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

  function init() {
    renderShell();
    setActive();
    bind();
    updateScrollState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
