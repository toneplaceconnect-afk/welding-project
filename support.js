(() => {
  'use strict';

  const REACT = ['/vendor/react.production.min.js','https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js','https://unpkg.com/react@18.3.1/umd/react.production.min.js'];
  const DOM = ['/vendor/react-dom.production.min.js','https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js','https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js'];

  const load = src => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });

  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

  // DC templates still contain legacy chrome. It must never enter the React tree,
  // because site-shell.js is the single source of truth for header/footer.
  const removeEmbeddedShell = () => {
    const dc = document.querySelector('x-dc');
    if (dc) dc.querySelectorAll('header.site-header, footer, .site-top').forEach(node => node.remove());
    document.querySelectorAll('body > footer, body > .site-top').forEach(node => node.remove());
  };

  const loadShell = () => load('./site-shell.js?v=20260914-10').catch(err => console.error('[site-shell] failed to load:', err));

  const raw = () => {
    document.querySelectorAll('style').forEach(s => {
      if ((s.textContent || '').includes('x-dc{display:none!important}')) s.remove();
    });
    const s = document.createElement('style');
    s.textContent = 'x-dc{display:block!important}';
    s.dataset.dcFallback = 'true';
    document.head.appendChild(s);
    console.warn('[dc] React unavailable or DC runtime failed; raw page kept visible');
  };

  const boot = async () => {
    removeEmbeddedShell();
    try {
      for (let i = 0; i < REACT.length && !(window.React && window.ReactDOM); i++) {
        try {
          if (!window.React) await load(REACT[i]);
          if (!window.ReactDOM) await load(DOM[i]);
        } catch (_) {}
      }
      if (!(window.React && window.ReactDOM)) throw new Error('React runtime unavailable');
      window.__resources = window.__resources || {};
      await load('./support-runtime.js?v=20260914-2');
      await nextFrame();
      const root = document.getElementById('dc-root');
      if (!root || !root.children.length) throw new Error('DC runtime did not mount the page');
    } catch (e) {
      raw();
      console.error('[dc] bootstrap failed:', e);
    } finally {
      await loadShell();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
