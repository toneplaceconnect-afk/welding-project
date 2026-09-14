(() => {
  'use strict';

  const PHONE = '+79831981588';
  const PHONE_HREF = `tel:${PHONE}`;
  const BRAND_NAME = 'ПРОЕКТ-СВАРКА';
  const BRAND_HTML = `<span class="site-header__brand-mark"><img src="assets/logo-mark.svg" alt="${BRAND_NAME}"><span class="site-header__flash" aria-hidden="true"></span></span><span class="site-brand-name">ПРОЕКТ<span class="site-brand-hyphen">-</span>СВАРКА</span>`;

  const HEADER_HTML = `
    <header class="site-header">
      <nav class="site-header__nav">
        <a class="site-header__brand" href="Главная.dc.html" aria-label="${BRAND_NAME}">${BRAND_HTML}</a>
        <button type="button" class="site-header__burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button>
        <div class="site-header__links">
          <a href="Главная.dc.html">Главная</a><a href="create.html">Создай своё</a><a href="Калькулятор.dc.html">Калькулятор</a><a href="Лофт-мебель.dc.html">Лофт-мебель</a><a href="Документация.dc.html">Документация</a><a href="Прайс.dc.html">Цены</a>
        </div>
        <a class="site-header__phone" href="${PHONE_HREF}" aria-label="Позвонить"><span class="site-header__phone-dot">☎</span><span class="site-header__phone-copy"><small>ЗВОНИТЕ СЕЙЧАС</small><strong>+7 983 198 15 88</strong></span></a>
      </nav>
    </header>`;

  const FOOTER_HTML = `
    <footer class="site-footer">
      <div class="site-footer__grid">
        <div>
          <a class="site-footer__brand" href="Главная.dc.html" aria-label="${BRAND_NAME}">${BRAND_HTML}</a>
          <p>Сварочные и инженерные работы в регионе. Расчёт по СП и ГОСТ, цена в договоре.</p>
        </div>
        <div><h3>Разделы</h3><div class="site-footer__links"><a href="Калькулятор.dc.html">Калькулятор материалов</a><a href="Лофт-мебель.dc.html">Лофт-мебель</a><a href="Документация.dc.html">Документация</a><a href="Прайс.dc.html">Цены</a></div></div>
        <div><h3>Контакты</h3><div class="site-footer__links"><a href="tel:${PHONE}">+7 983 198 15 88</a><a href="https://t.me/welding_project" target="_blank" rel="noopener">@welding_project</a><a href="mailto:ProektSvarka@yandex.ru">ProektSvarka@yandex.ru</a><span>Работаю по региону</span></div></div>
      </div>
      <div class="site-footer__bottom"><span>Проект-Сварка. Выезд и замер бесплатно.</span><a href="https://t.me/CompilePoint" target="_blank" rel="noopener"><img src="assets/logo-compilepoint-mark.png" alt="CompilePoint"><span>Разработано в «Точка Сборки»</span></a></div>
    </footer>`;

  function installBrandRules() {
    if (document.getElementById('site-header-brand-rules')) return;
    const style = document.createElement('style');
    style.id = 'site-header-brand-rules';
    style.textContent = `
      .site-header__brand,.site-footer__brand{font-family:Michroma,Unbounded,Inter,system-ui,sans-serif!important;font-size:14px!important;font-weight:700!important;letter-spacing:0!important;word-spacing:0!important}
      .site-header__brand .site-brand-name,.site-footer__brand .site-brand-name{white-space:nowrap!important;word-spacing:0!important}
      .site-brand-hyphen{font-family:Arial,Helvetica,sans-serif!important;color:#cf2026!important;font-weight:900!important}
      @media(max-width:900px){.site-header__brand{font-size:14px!important}}
      @media(max-width:560px){.site-header__brand{font-size:14px!important}}
    `;
    document.head.appendChild(style);
  }

  function isCreatePage() { return /(?:^|\/)create\.html$/i.test(location.pathname); }
  function isInsideDc(node) { return !!(node && node.closest && node.closest('x-dc')); }

  function replaceCreateFooter() {
    if (!isCreatePage() || !document.body) return;
    document.querySelectorAll('body > footer').forEach((footer) => footer.remove());
    if (!document.querySelector('body > .site-footer')) {
      document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
    }
  }

  function ensureHeader() {
    const root = document.body; if (!root) return null;
    const headers = Array.from(document.querySelectorAll('.site-header'));
    let header = headers[0] || null;
    headers.slice(1).forEach((extra) => extra.remove());
    if (!header) {
      const wrap = document.createRange().createContextualFragment(HEADER_HTML);
      header = wrap.firstElementChild; root.insertBefore(header, root.firstChild);
    }
    const dc = root.querySelector('x-dc');
    if (dc && isInsideDc(header) && dc.parentNode === root) root.insertBefore(header, dc);
    const brand = header.querySelector('.site-header__brand');
    if (brand) brand.innerHTML = BRAND_HTML;
    const phone = header.querySelector('.site-header__phone');
    if (phone) { phone.href = PHONE_HREF; phone.removeAttribute('target'); phone.removeAttribute('rel'); phone.setAttribute('aria-label', 'Позвонить'); }
    return header;
  }

  function normalizeExistingFooter() {
    if (isCreatePage()) return;
    document.querySelectorAll('footer a[href="Главная.dc.html"]').forEach((brand) => {
      const mark = brand.querySelector('span[style*="width:44px"], .site-header__brand-mark');
      if (!mark || brand.dataset.brandNormalized === '1') return;
      const existingMark = mark.outerHTML;
      brand.innerHTML = `${existingMark}<span class="site-brand-name">ПРОЕКТ<span class="site-brand-hyphen">-</span>СВАРКА</span>`;
      brand.dataset.brandNormalized = '1';
    });
  }

  function scrollToTop() {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('[data-scroll-container]').forEach((el) => { el.scrollTop = 0; });
  }

  function ensureTopButton() {
    const root = document.body; if (!root) return null;
    const buttons = Array.from(document.querySelectorAll('.site-top'));
    let top = buttons[0] || null;
    buttons.slice(1).forEach((extra) => extra.remove());
    if (!top) {
      top = document.createElement('button'); top.type = 'button'; top.className = 'site-top';
      top.setAttribute('aria-label', 'Наверх'); top.title = 'Наверх'; top.textContent = '↑'; root.appendChild(top);
    } else if (isInsideDc(top)) root.appendChild(top);
    if (!top.__scrollTopBound) {
      top.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); scrollToTop(); });
      top.__scrollTopBound = true;
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
    const y = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
    const top = document.querySelector('.site-top'); if (top) top.classList.toggle('is-visible', y > 180);
    const header = document.querySelector('.site-header'); if (header) header.classList.toggle('is-scrolled', y > 10);
  }

  function closeMenu() {
    const links = document.querySelector('.site-header__links'); const burger = document.querySelector('.site-header__burger');
    if (links) links.classList.remove('is-open'); if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  function syncSharedUi() { installBrandRules(); replaceCreateFooter(); ensureHeader(); ensureTopButton(); normalizeExistingFooter(); setActiveLink(); updateOnScroll(); }

  function init() {
    syncSharedUi();
    if (!window.__siteHeaderObserver) {
      const observer = new MutationObserver(() => syncSharedUi());
      observer.observe(document.body, { childList: true, subtree: true }); window.__siteHeaderObserver = observer;
    }
  }

  document.addEventListener('click', (event) => {
    const burger = event.target.closest('.site-header__burger');
    if (burger) { event.stopPropagation(); const links = document.querySelector('.site-header__links'); if (!links) return; const open = links.classList.toggle('is-open'); burger.setAttribute('aria-expanded', String(open)); return; }
    const link = event.target.closest('.site-header__links a'); if (link) { closeMenu(); return; }
    const links = document.querySelector('.site-header__links'); if (links && links.classList.contains('is-open') && !event.target.closest('.site-header__links')) closeMenu();
  });

  window.addEventListener('scroll', updateOnScroll, { passive: true }); window.addEventListener('load', updateOnScroll);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
