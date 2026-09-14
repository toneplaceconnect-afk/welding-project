(() => {
  'use strict';

  // ВАЖНО: на .dc.html-страницах support.js подключает React и через некоторое
  // время после первой загрузки заменяет содержимое <x-dc> (в том числе нашу
  // шапку) на новое дерево, отрендеренное React. Это происходит ПОСЛЕ того,
  // как этот скрипт (defer) уже успевает найти исходные элементы и повесить
  // на них обработчики — из-за чего старые слушатели остаются висеть на уже
  // выброшенных из DOM узлах, а новые (React-пересозданные) элементы остаются
  // без единого обработчика вообще. Поэтому вся логика ниже работает через
  // делегирование на document, а не через прямые ссылки на конкретные узлы —
  // так она продолжает работать независимо от того, сколько раз и когда
  // конкретные элементы шапки будут пересозданы.

  function closeMenu() {
    const links = document.querySelector('.site-header__links');
    const burger = document.querySelector('.site-header__burger');
    if (links) links.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
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
    if (top) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  window.addEventListener('scroll', () => {
    const top = document.querySelector('.site-top');
    if (top) top.classList.toggle('is-visible', window.scrollY > 180);
  }, { passive: true });

  // на случай если страница уже проскроллена к моменту загрузки скрипта
  window.addEventListener('load', () => {
    const top = document.querySelector('.site-top');
    if (top) top.classList.toggle('is-visible', window.scrollY > 180);
  });
})();
