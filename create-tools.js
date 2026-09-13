(() => {
  const init = () => {
    const results = [document.getElementById('r1'), document.getElementById('r2')].filter(Boolean);
    const status = document.getElementById('status');
    if (!results.length) return;

    const style = document.createElement('style');
    style.textContent = `
      .result-tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
      .result-tools button{border:1px solid #3b404b;background:#1b1e27;color:#fff;padding:8px 9px;font-size:8px;font-weight:700;cursor:pointer}
      .result-tools button:hover{border-color:#cf2026;color:#fff}
      .result-wrap{min-width:0}
      .sketch-lightbox{position:fixed;inset:0;background:rgba(5,7,10,.92);z-index:99999;display:none;align-items:center;justify-content:center;padding:30px}
      .sketch-lightbox.open{display:flex}
      .sketch-lightbox img{max-width:94vw;max-height:90vh;width:auto;height:auto;object-fit:contain;box-shadow:0 20px 70px #000}
      .sketch-lightbox .close{position:absolute;right:22px;top:16px;border:0;background:#cf2026;color:#fff;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer}
      .result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .result-actions button{border:1px solid #3b404b;background:#1b1e27;color:#fff;padding:11px 13px;font-size:8px;font-weight:800;cursor:pointer}
      .result-actions button:hover{border-color:#cf2026}
      @media(max-width:560px){.sketch-lightbox{padding:10px}.sketch-lightbox img{max-width:98vw;max-height:82vh}}
    `;
    document.head.appendChild(style);

    const lightbox = document.createElement('div');
    lightbox.className = 'sketch-lightbox';
    lightbox.innerHTML = '<button class="close" aria-label="Закрыть">×</button><img alt="Увеличенный эскиз">';
    document.body.appendChild(lightbox);
    const lightImg = lightbox.querySelector('img');
    const close = () => lightbox.classList.remove('open');
    lightbox.querySelector('.close').onclick = close;
    lightbox.onclick = e => { if (e.target === lightbox) close(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    const getImage = box => box.querySelector('img');
    const download = (src, index) => {
      const a = document.createElement('a');
      a.href = src;
      a.download = `proekt-svarka-sketch-${index + 1}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    };
    const openZoom = (src, index) => {
      lightImg.src = src;
      lightImg.alt = `Увеличенный эскиз ${index + 1}`;
      lightbox.classList.add('open');
    };

    const addTools = (box, index) => {
      if (box.dataset.toolsAdded) return;
      box.dataset.toolsAdded = '1';
      const wrap = document.createElement('div');
      wrap.className = 'result-wrap';
      box.parentNode.insertBefore(wrap, box);
      wrap.appendChild(box);
      const tools = document.createElement('div');
      tools.className = 'result-tools';
      tools.innerHTML = '<button type="button" class="zoom">УВЕЛИЧИТЬ</button><button type="button" class="download">СКАЧАТЬ</button>';
      wrap.appendChild(tools);
      tools.querySelector('.zoom').onclick = () => { const img = getImage(box); if (img) openZoom(img.src, index); };
      tools.querySelector('.download').onclick = () => { const img = getImage(box); if (img) download(img.src, index); };
    };
    results.forEach(addTools);

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.innerHTML = '<button type="button" id="shareTg">ОТПРАВИТЬ В TELEGRAM</button><button type="button" id="shareMail">ОТПРАВИТЬ НА E-MAIL</button><button type="button" id="downloadAll">СКАЧАТЬ ЭСКИЗЫ</button>';
    const summary = document.querySelector('.summary');
    const confirm = document.getElementById('confirm');
    if (confirm) confirm.after(actions); else if (summary) summary.appendChild(actions);

    const getSummary = () => {
      const text = [
        'Заявка «Проект-Сварка»',
        `Изделие: ${document.getElementById('sProduct')?.textContent || ''}`,
        `Размер: ${document.getElementById('sSize')?.textContent || ''}`,
        `Материалы: ${document.getElementById('sMaterial')?.textContent || ''}`,
        `Металл: ${document.getElementById('sColor')?.textContent || ''}`,
        `Место: ${document.getElementById('sPlace')?.textContent || ''}`,
        `Описание: ${document.getElementById('description')?.value || ''}`
      ];
      return text.join('\n');
    };

    document.getElementById('shareTg').onclick = () => {
      const text = encodeURIComponent(getSummary());
      window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${text}`, '_blank', 'noopener');
    };
    document.getElementById('shareMail').onclick = () => {
      const subject = encodeURIComponent('Заявка на изделие — Проект-Сварка');
      const body = encodeURIComponent(getSummary() + '\n\nЭскизы можно скачать со страницы: ' + location.href);
      location.href = `mailto:?subject=${subject}&body=${body}`;
    };
    document.getElementById('downloadAll').onclick = () => {
      results.forEach((box, i) => { const img = getImage(box); if (img) setTimeout(() => download(img.src, i), i * 250); });
    };

    const observer = new MutationObserver(() => results.forEach(addTools));
    results.forEach(box => observer.observe(box, {childList:true,subtree:true}));
    window.addEventListener('beforeunload', () => observer.disconnect(), {once:true});
    if (status) status.dataset.toolsReady = '1';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
