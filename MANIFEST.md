# ПРОЕКТ-СВАРКА — технический манифест

Дата аудита и архитектурной очистки: 2026-09-15 (v3)

## Статус

**Архитектурная очистка выполнена. Production deployment READY.**

Проект: `toneplaceconnect-afk/welding-project`.

## Что было сломано

- Дублирующие footer/header на всех 5 DC-страницах (инлайн + site-shell.js);
- `site-header.js` — мёртвый файл, загружался всеми страницами;
- Телефон в инлайн-шапках вёл в Telegram вместо `tel:`;
- `site-shell.js` селектор `body > footer` не удалял вложенные футеры;
- Google Fonts загружались с разными весами на разных страницах;
- `create.html` использовала Inter вместо Michroma;
- `lang="ru"` отсутствовал на всех DC-страницах;
- Media-query в `create-actions.css` в неправильном порядке;
- API раскрывал внутренние ошибки Cloudflare клиенту;
- `site-header.css` и `site-shell.js` имели разные версии кеша;
- Футер прижимался к верху страницы вместо низа (`FULL_PAGE_CSS` с `height:100%`);
- Шапка/футер использовали Inter вместо Michroma;
- `position:sticky` на шапке ломался из-за `overflow-x:hidden` в mobile.css.

## Новая архитектура

Shared chrome имеет один runtime-источник:

### `site-shell.js`

Единственный JavaScript-источник:
- header;
- footer;
- мобильное меню;
- телефон (`tel:+79831981588`);
- кнопка «Наверх»;
- active-состояние пункта меню;
- состояние header при прокрутке.

Внутри нет `MutationObserver`, повторной синхронизации DOM.

Shell создаётся один раз при загрузке страницы.

### `site-header.css`

Единый CSS для header, footer, логотипа, анимации, мобильного меню, кнопки «Наверх».

### DC runtime

`support.js`:
1. ждёт готовности DOM;
2. извлекает header/footer из `<x-dc>` до запуска React (defensive, currently no-op);
3. запускает React;
4. запускает `support-runtime.js`;
5. после этого подключает `site-shell.js`;
6. при недоступности React оставляет raw DC-страницу видимой и подключает shell.

`window.__resources` инициализируется пустым объектом до запуска runtime (совместимость с generated runtime).

### Шрифты

Единый стек для **всех** элементов (контент, шапка, футер, навигация):
`'Michroma', 'Unbounded', 'Inter', system-ui, sans-serif`

Бренд/заголовки: `'Unbounded', 'Michroma', 'Inter', system-ui, sans-serif`

Google Fonts: `Michroma`, `Unbounded:wght@400-800`, `Inter:wght@400-800` — единый набор на всех страницах.

### Доступность

- `lang="ru"` на всех страницах;
- `<meta name="theme-color" content="#11131a">` на всех страницах.

## Layout

- `FULL_PAGE_CSS` устанавливает `min-height:100vh` на `#dc-root` и `.sc-host` (без фиксированного `height:100%`);
- `body` использует естественную высоту (auto) — футер прижат к низу;
- `overflow-x:clip` вместо `overflow-x:hidden` на `html,body` — не ломает `position:sticky`.

## Create (`create.html`)

Страница разделяет единый shell:
- `site-shell.js` (header, footer, кнопка «Наверх»);
- `site-header.css` (стили шапки/футера);
- `mobile.css` (адаптивность);
- `create-actions.css` (специфичные стили Create);
- `create-actions.js` (action-кнопки);
- шрифт Michroma как основной.

Функции конструктора:
- описание изделия;
- загрузка до двух изображений;
- `/api/generate-sketch`;
- один результат визуализации;
- action-кнопки.

## Удалённые костыли

Удалён файл `site-header.js` — пустой IIFE, загружался всеми DC-страницами без пользы.

Из DC-страниц удалены:
- инлайн `<header class="site-header">` (5 файлов);
- инлайн `<footer>` (5 файлов);
- кнопки `.site-top` (5 файлов);
- ссылки на `site-header.js` (5 файлов).

## Исправления API

- Ошибки Cloudflare не раскрываются клиенту;
- Добавлена валидация prompt (макс. 3000 символов);
- Добавлена валидация referenceImages (макс. 2).

## Что сохранено

- DC-разметка контента;
- навигационные URL;
- `vercel.json` redirects/rewrites;
- `support-runtime.js` (generated DC runtime);
- `mobile.css` (адаптивность);
- `create-actions.js/css`;
- `image-slot.js`;
- `_ds/` (Nocturne DS — загружается DC-страницами, токены перезаписываются inline-стилями).

## Критерий дальнейших изменений

Не добавлять новый JS/CSS для исправления отдельных страниц.

Изменения header/footer/logo/mobile navigation — только через:
- `site-shell.js`;
- `site-header.css`.

DC runtime не должен снова получать отдельную реализацию chrome.
