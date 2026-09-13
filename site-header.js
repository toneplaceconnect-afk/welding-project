(() => {
  'use strict';

  const initHeader = () => {
    const burger = document.querySelector('.site-header__burger');
    const links = document.querySelector('.site-header__links');

    if (burger && links) {
      const closeMenu = () => {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      };

      burger.setAttribute('aria-expanded', 'false');
      burger.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = links.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });

      links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

      document.addEventListener('click', (event) => {
        if (!links.classList.contains('is-open')) return;
        if (links.contains(event.target) || burger.contains(event.target)) return;
        closeMenu();
      });
    }

    const top = document.querySelector('.site-top');
    if (top) {
      top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      const updateTop = () => top.classList.toggle('is-visible', window.scrollY > 180);
      window.addEventListener('scroll', updateTop, { passive: true });
      updateTop();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
