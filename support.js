/* Project-Svarka DC bootstrap: resilient React loading with visible raw-page fallback. */
(() => {
  'use strict';
  const RUNTIME = './support-runtime.js';
  const REACT = ['https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js','https://unpkg.com/react@18.3.1/umd/react.production.min.js'];
  const DOM = ['https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js','https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js'];
  const load = src => new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('failed to load '+src));document.head.appendChild(s);});
  const raw = () => { document.querySelectorAll('style').forEach(s=>{if((s.textContent||'').includes('x-dc{display:none!important}'))s.remove()}); const s=document.createElement('style');s.textContent='x-dc{display:block!important}';s.dataset.dcFallback='true';document.head.appendChild(s); console.warn('[dc] React unavailable; raw page kept visible'); };
  (async()=>{ try { for(let i=0;i<2 && !(window.React&&window.ReactDOM);i++){ try{if(!window.React)await load(REACT[i]);if(!window.ReactDOM)await load(DOM[i]);}catch(_){}} if(!(window.React&&window.ReactDOM)) throw new Error('React CDN unavailable'); await load(RUNTIME); } catch(e){ raw(); console.error('[dc] bootstrap failed:',e); } })();
})();
