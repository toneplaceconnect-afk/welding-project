(() => {
  'use strict';

  const NAV = [
    ['Главная', 'Главная.dc.html', 'home'],
    ['Создай своё', 'create.html', 'create'],
    ['Калькулятор', 'Калькулятор.dc.html', 'calculator'],
    ['Лофт-мебель', 'Лофт-мебель.dc.html', 'loft'],
    ['Документация', 'Документация.dc.html', 'docs'],
    ['Цены', 'Прайс.dc.html', 'prices']
  ];

  const styles = `
.site-header,.site-header *{box-sizing:border-box}
.site-header{position:sticky;top:0;z-index:1000;width:100%;background:#11131a;border-bottom:1px solid rgba(255,255,255,.08);font-family:Inter,Arial,sans-serif}
.site-header__nav{max-width:1240px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.site-header__brand{display:flex;align-items:center;gap:10px;color:#fff!important;font-family:Unbounded,Arial,sans-serif!important;font-weight:700!important;font-size:12px!important;line-height:1!important;text-decoration:none;white-space:nowrap}
.site-header__brand-mark{display:inline-flex;width:44px;height:44px;flex:0 0 44px;align-items:center;justify-content:center}
.site-header__brand-mark svg{display:block;width:100%;height:100%;overflow:visible}
.site-header__brand em{color:#cf2026;font-family:Arial,Helvetica,sans-serif!important;font-style:normal;font-weight:900;margin:0 -.22em}
.site-header__links{display:flex;align-items:center;gap:18px;flex-wrap:wrap;font-family:Inter,Arial,sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:1.2!important;letter-spacing:0!important}
.site-header__links a,.site-header__links a:link,.site-header__links a:visited{display:block!important;color:#c9ccd6!important;padding:7px 0 6px!important;margin:0!important;border:0!important;border-bottom:2px solid transparent!important;transition:color .2s,border-color .2s;white-space:nowrap;text-decoration:none!important;font-family:Inter,Arial,sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:1.2!important;letter-spacing:0!important;text-transform:none!important}
.site-header__links a:hover,.site-header__links a:focus-visible,.site-header__links a.active{color:#fff!important;border-bottom-color:#cf2026!important}
.site-header__phone{margin-left:auto;display:flex;align-items:center;gap:12px;color:#fff!important;text-decoration:none;white-space:nowrap}
.site-header__phone-dot{width:30px;height:30px;border:1px solid #cf2026;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#cf2026;font-size:13px;flex:0 0 auto}
.site-header__phone-copy{display:flex;flex-direction:column;line-height:1.3}.site-header__phone-copy small{font-size:8px;letter-spacing:.12em;color:#8d92a3}.site-header__phone-copy strong{font-size:12px;font-weight:700}
.site-top{position:fixed;right:22px;bottom:22px;z-index:1100;width:44px;height:44px;border:1px solid #cf2026;border-radius:50%;background:#11131a;color:#fff;display:flex;align-items:center;justify-content:center;font:700 20px/1 Arial,sans-serif;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .2s,transform .2s,visibility .2s,background .2s;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.site-top.is-visible{opacity:1;visibility:visible;transform:none}.site-top:hover{background:#cf2026;color:#fff}
@keyframes site-logo-flash{0%,88%,100%{opacity:.15;transform:scale(.7)}92%{opacity:1;transform:scale(1.25)}95%{opacity:.45;transform:scale(.95)}97%{opacity:.9;transform:scale(1.1)}}
.site-logo-flash{transform-box:fill-box;transform-origin:38px 92px;animation:site-logo-flash 5s ease-in-out infinite}
@media(max-width:900px){
.site-header__nav{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px 12px;padding:9px 14px;max-width:100%;width:100%}
.site-header__brand{min-width:0;font-size:10px!important;gap:7px}.site-header__brand-mark{width:38px;height:38px;flex-basis:38px}
.site-header__links{grid-column:1/-1;min-width:0;width:100%;display:flex;flex-wrap:nowrap;gap:16px;overflow-x:auto;overflow-y:hidden;padding:2px 0 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;font-size:12.5px!important}
.site-header__links::-webkit-scrollbar{display:none}.site-header__links a,.site-header__links a:link,.site-header__links a:visited{flex:0 0 auto;font-size:12.5px!important}
.site-header__phone{margin-left:0;justify-self:end;gap:7px}.site-header__phone-dot{width:28px;height:28px;font-size:12px}.site-header__phone-copy small{display:none}.site-header__phone-copy strong{font-size:9.5px}.site-top{right:14px;bottom:14px;width:44px;height:44px}
}
@media(max-width:560px){
.site-header__brand{font-size:9.5px!important}.site-header__brand-mark{width:34px;height:34px;flex-basis:34px}.site-header__links{gap:14px;font-size:12px!important}.site-header__links a,.site-header__links a:link,.site-header__links a:visited{font-size:12px!important}.site-header__phone-copy strong{font-size:8.5px}.site-top{right:12px;bottom:12px;width:46px;height:46px;font-size:21px}
}
`;

  const LOGO_SVG = `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path d="M32 97A50 50 0 0 1 60 8" stroke="#9aa1ad" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M60 8a50 50 0 0 1 28 90" stroke="#cf2026" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M26 62 60 32l34 30" stroke="#cf2026" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M38 54v38h38" stroke="#9aa1ad" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M80 56v36" stroke="#cf2026" stroke-width="12" stroke-linecap="round" fill="none"/>
    <g stroke="#cf2026" stroke-width="4" stroke-linecap="round" fill="none"><path d="M38 92 26 104M38 92 22 94M38 92 30 108M38 92 46 106M38 92 24 82"/></g>
    <circle cx="38" cy="92" r="5.5" fill="#fff3d6"/>
    <circle class="site-logo-flash" cx="38" cy="92" r="11" fill="url(#siteLogoGlow)"/>
    <defs><radialGradient id="siteLogoGlow"><stop offset="0" stop-color="#fff"/><stop offset=".32" stop-color="#ff5a60"/><stop offset="1" stop-color="#cf2026" stop-opacity="0"/></radialGradient></defs>
  </svg>`;

  function currentKey() {
    const p = decodeURIComponent(location.pathname || '/').toLowerCase();
    if (p.endsWith('/create.html')) return 'create';
    if (p.includes('калькулятор')) return 'calculator';
    if (p.includes('лофт-мебель')) return 'loft';
    if (p.includes('документация')) return 'docs';
    if (p.includes('прайс')) return 'prices';
    return 'home';
  }

  function injectStyles() {
    let style = document.getElementById('site-ui-styles');
    if (!style) { style = document.createElement('style'); style.id='site-ui-styles'; document.head.appendChild(style); }
    style.textContent = styles;
  }

  function renderHeader(header) {
    const key=currentKey(); header.className='site-header'; header.dataset.siteHeader='1';
    header.innerHTML=`<nav class="site-header__nav"><a class="site-header__brand" href="Главная.dc.html" aria-label="Проект-Сварка"><span class="site-header__brand-mark">${LOGO_SVG}</span><span>ПРОЕКТ<em>-</em>СВАРКА</span></a><div class="site-header__links">${NAV.map(([label,href,k])=>`<a href="${href}" class="${key===k?'active':''}">${label}</a>`).join('')}</div><a class="site-header__phone" href="https://t.me/welding_project" target="_blank" rel="noopener" aria-label="Связаться в Telegram"><span class="site-header__phone-dot">☎</span><span class="site-header__phone-copy"><small>ЗВОНИТЕ СЕЙЧАС</small><strong>+7 983 198 15 88</strong></span></a></nav>`;
  }

  function mountHeader() {
    const slot=document.getElementById('site-header-slot');
    if(slot){const header=document.createElement('header');renderHeader(header);slot.replaceWith(header);return;}
    const existing=document.querySelector('header:not([data-site-header])');
    if(existing) renderHeader(existing);
  }

  function mountTopButton() {
    document.querySelectorAll('.site-top').forEach((el,i)=>{if(i)el.remove()});
    let b=document.querySelector('.site-top');
    if(!b){b=document.createElement('button');b.type='button';b.className='site-top';b.setAttribute('aria-label','Наверх');b.title='Наверх';b.textContent='↑';b.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));document.body.appendChild(b)}
    if(!b.dataset.siteTopBound){window.addEventListener('scroll',()=>b.classList.toggle('is-visible',window.scrollY>180),{passive:true});b.dataset.siteTopBound='1'}
    b.classList.toggle('is-visible',window.scrollY>180);
  }

  function mount(){injectStyles();mountHeader();mountTopButton()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
