(() => {
  'use strict';

  const HEADER_HTML = `
    <header class="site-header">
      <nav class="site-header__nav">
        <a class="site-header__brand" href="Главная.dc.html" aria-label="Проект-Сварка">
          <span class="site-header__brand-mark">
            <img src="assets/logo-mark.svg" alt="Проект-Сварка">
            <span class="site-header__flash" aria-hidden="true"></span>
          </span>
          <span>ПРОЕКТ<em>-</em>СВАРКА</span>
        </a>
        <button type="button" class="site-header__burger" aria-label="Меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <div class="site-header__links">
          <a href="Главная.dc.html">Главная</a>
          <a href="create.html">Создай своё</a>
          <a href="Калькулятор.dc.html">Калькулятор</a>
          <a href="Лофт-мебель.dc.html">Лофт-мебель</a>
          <a href="Документация.dc.html">Документация</a>
          <a href="Прайс.dc.html">Цены</a>
        </div>
        <a class="site-header__phone" href="https://t.me/welding_project" target="_blank" rel="noopener" aria-label="Связаться в Telegram">
          <span class="site-header__phone-dot">☎</span>
          <span class="site-header__phone-copy"><small>ЗВОНИТЕ СЕЙЧАС</small><strong>+7 983 198 15 88</strong></span>
        </a>
      </nav>
    </header>`;

  function isInsideDc(node) {
    return !!(node && node.closest && node.closest('x-dc'));
  }

  function ensureHeader() {
    let header = document.querySelector('.site-header');
    const root = document.body;
    const dc = root.querySelector('x-dc');

    if (!header) {
      const wrap = document.createRange().createContextualFragment(HEADER_HTML);
      header = wrap.firstElementChild;
      root.insertBefore(header, root.firstChild);
    } else if (isInsideDc(header)) {
      root.insertBefore(header, dc || root.firstChild);
    }

    return header;
  }

  function ensureTopButton() {
    let top = document.querySelector('.site-top');
    if (!top) {
      top = document.createElement('button');
      top.type = 'button';
      top.className = 'site-top';
      top.setAttribute('aria-label', 'Наверх');
      top.title = 'Наверх';
      top.textContent = '↑';
      document.body.appendChild(top);
    } else if (isInsideDc(top)) {
      document.body.appendChild(top);
    }
    return top;
  }

  function setActiveLink() {
    const current = decodeURIComponent(location.pathname.split('/').pop() || '');
    document.querySelectorAll('.site-header__links a').forEach((a) => {
      const href = decodeURIComponent((a.getAttribute('href') || '').split('/').pop() || '');
      a.classList.toggle('active', href === current || (!current && href === 'Главная.dc.html'));
    });
  }

  function updateOnScroll() {
    const top = document.querySelector('.site-top');
    if (top) top.classList.toggle('is-visible', window.scrollY > 180);
    const header = document.querySelector('.site-header');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
  }

  function closeMenu() {
    const links = document.querySelector('.site-header__links');
    const burger = document.querySelector('.site-header__burger');
    if (links) links.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  function init() {
    ensureHeader();
    ensureTopButton();
    setActiveLink();
    updateOnScroll();

    if (!window.__siteHeaderObserver) {
      const observer = new MutationObserver(() => {
        ensureHeader();
        ensureTopButton();
        setActiveLink();
        updateOnScroll();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.__siteHeaderObserver = observer;
    }
  }

  document.addEventListener('click', (event) => {
    const burger = event.target.closest('.site-header__burger');
    if (burger) {
      event.stopPropagation();
      const links = document.querySelector('.site-header__links');
      if (!links) return;
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      return;
    }

    const link = event.target.closest('.site-header__links a');
    if (link) {
      closeMenu();
      return;
    }

    const links = document.querySelector('.site-header__links');
    if (links && links.classList.contains('is-open') && !event.target.closest('.site-header__links')) {
      closeMenu();
    }

    const top = event.target.closest('.site-top');
    if (top) window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('load', updateOnScroll);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
