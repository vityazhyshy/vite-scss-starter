# vite-scss-starter

Современный starter для многостраничных проектов на `Vite + SCSS + Vanilla JS` с HTML-шаблонами через `@@include(...)`, генераторами страниц и БЭМ-блоков, а также встроенным asset pipeline.

Проект остается MPA без React, Vue и других SPA-фреймворков:

- страницы лежат в `src/views`
- крупные блоки лежат в `src/blocks/modules`
- мелкие переиспользуемые элементы лежат в `src/blocks/components`
- HTML подключается через `@@include(...)`
- SCSS подключается через агрегаторы
- JS блоков подключается через `src/js/import`

## Возможности

- Vite dev server и production build
- SCSS + PostCSS + Autoprefixer
- HTML partials через `@@include(...)`
- автоформатирование итоговых HTML при build
- сборка MPA-страниц из `src/views/*.html`
- генерация SVG-спрайта
- оптимизация изображений
- генерация WebP
- генерация favicon
- генераторы страниц, модулей и компонентов
- ESLint, Stylelint, Prettier
- smoke-тесты на Vitest
- единая команда полной проверки перед релизом
- отчет по размеру build-артефактов
- защита от параллельных production-сборок в один `dist`

## Требования

- Node.js `18.20+`
- npm `10+`

## Установка

```bash
npm install
```

## Быстрый старт

Запуск режима разработки:

```bash
npm run dev
```

Vite будет доступен по:

- `http://localhost:5173`
- локальному IP в вашей сети, например `http://192.168.0.10:5173`

Production build:

```bash
npm run build
```

Production build без хэшей:

```bash
npm run build:no-hash
```

Локальный просмотр production build:

```bash
npm run preview
```

## Структура проекта

```text
vite-scss-starter
├── public
│   └── img
├── scripts
├── src
│   ├── blocks
│   │   ├── components
│   │   ├── modules
│   │   ├── _components.scss
│   │   └── _modules.scss
│   ├── img
│   ├── js
│   │   ├── import
│   │   └── main.js
│   ├── styles
│   └── views
│       ├── pages
│       │   └── page.html
│       ├── 404.html
│       └── index.html
├── tests
├── package.json
└── vite.config.mjs
```

## Где писать код

Весь исходный код пишется только в `src/`.

Не редактируйте:

- `dist/` — это итог build
- `public/img/` — это сгенерированные ассеты из `src/img`

Исходные изображения и SVG нужно хранить в `src/img`.

## Основные команды

### Разработка и сборка

- `npm run dev` — dev server
- `npm run build` — production build с хэшами
- `npm run build:no-hash` — production build без хэшей
- `npm run preview` — preview production build

### Полные проверки

- `npm run build:check` — `format:check + lint + test + build`
- `npm run build:report` — `build + отчет по размеру файлов в dist`

### Линтинг и форматирование

- `npm run lint`
- `npm run lint:fix`
- `npm run lint:js`
- `npm run lint:scripts`
- `npm run lint:scripts:fix`
- `npm run lint:styles`
- `npm run lint:styles:fix`
- `npm run format`
- `npm run format:check`

### Тесты

- `npm run test`
- `npm run test:watch`

### Ассеты

- `npm run assets:prepare`
- `npm run assets:sprites`
- `npm run assets:images`
- `npm run assets:webp`
- `npm run assets:favicons`

Совместимые алиасы:

- `npm run build:sprites`
- `npm run build:images`
- `npm run build:webp`
- `npm run build:favicons`

### Генераторы

- `npm run new:page -- about`
- `npm run block -- --type=module hero`
- `npm run block -- --type=module --page=index hero`
- `npm run block -- --type=component button`
- `npm run bem-m -- hero`
- `npm run bem-c -- button`

## Как создавать страницу

Создать новую страницу:

```bash
npm run new:page -- about
```

Будет создан файл:

```text
src/views/about.html
```

Источник шаблона:

```text
src/views/pages/page.html
```

Дополнительно можно передать title:

```bash
npm run new:page -- --title="About Company" about
```

## Как создавать модуль или компонент

Создать модуль:

```bash
npm run bem-m -- hero
```

Или:

```bash
npm run block -- --type=module hero
```

Будут созданы:

```text
src/blocks/modules/hero/hero.html
src/blocks/modules/hero/hero.scss
src/blocks/modules/hero/hero.js
```

Также генератор:

- добавит SCSS в `src/blocks/_modules.scss`
- добавит JS import в `src/js/import/modules.js`
- при передаче `--page=<page>` вставит `@@include(...)` в нужную страницу

Создать компонент:

```bash
npm run bem-c -- button
```

Или:

```bash
npm run block -- --type=component button
```

## HTML и шаблоны

Страницы и блоки подключаются через:

```html
@@include("../blocks/modules/hero/hero.html")
```

Можно передавать параметры:

```html
@@include("../blocks/modules/header/header.html", { "title": "Home" })
```

Во время build:

- include-файлы разворачиваются
- итоговые HTML перемещаются в корень `dist`
- итоговые HTML автоматически форматируются через Prettier

## SCSS и стили

Основная точка входа:

```text
src/styles/main.scss
```

SCSS helper-файлы подключаются глобально через Vite config, поэтому mixins/functions доступны в SCSS без ручного `@use` в каждом файле.

Проект использует lightweight BEM:

- допустимо: `block__element`
- не использовать: `block__elem__subelem`
- состояния задаются глобальными классами: `.is-active`, `.is-open`, `.is-hidden`

## JavaScript

Главная точка входа:

```text
src/js/main.js
```

Импорты блоков и компонентов подключаются через:

- `src/js/import/modules.js`
- `src/js/import/components.js`

Если блок создан генератором, нужные импорты добавляются автоматически.

## Изображения и ассеты

Исходники:

- `src/img/favicon` — favicon source
- `src/img/sprites` — SVG для sprite
- остальные изображения — в `src/img`

Результат asset pipeline:

- оптимизированные изображения попадают в `public/img`
- SVG-спрайт собирается в `public/img/sprites/sprite.svg`
- favicon генерируется в `public/img/favicons`

Во время `build` asset pipeline запускается автоматически.

В dev-режиме изменения в `src/img` тоже отслеживаются.

## Build output

По умолчанию build создает:

- HTML в корне `dist`
- JS в `dist/assets/js`
- CSS в `dist/assets/styles`

`npm run build:no-hash` генерирует чистые имена файлов:

- `main.min.js`
- `main.min.css`

## Проверки перед релизом

Рекомендуемый сценарий:

```bash
npm run build:check
```

Команда проверяет:

1. форматирование
2. линтинг
3. smoke-тесты
4. production build

Если нужен отчет по весу артефактов:

```bash
npm run build:report
```

## Важные особенности

- Не запускайте две production-сборки одновременно в один `dist`: проект теперь сам блокирует второй build понятной ошибкой.
- `build:no-hash` удобен для интеграций, где нужны стабильные имена файлов.
- `preview` и `dev` доступны и по `localhost`, и по локальному IP.
- В репозитории не должны храниться локальные пути, пароли, токены, ключи и другие чувствительные данные.

## Рекомендованный рабочий поток

1. `npm install`
2. `npm run dev`
3. создавайте страницы и блоки через генераторы
4. складывайте исходные изображения в `src/img`
5. перед релизом запускайте `npm run build:check`
6. при необходимости смотрите размеры через `npm run build:report`

## Лицензия

`GPL-3.0-only`
