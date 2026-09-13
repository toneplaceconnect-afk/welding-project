(() => {
  'use strict';

  const burger = document.querySelector('.site-header__burger');
  const links = document.querySelector('.site-header__links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('click', (e) => {
      if (!links.classList.contains('is-open')) return;
      if (links.contains(e.target) || burger.contains(e.target)) return;
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  const top = document.querySelector('.site-top');
  if (top) {
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const update = () => top.classList.toggle('is-visible', window.scrollY > 180);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
})();
