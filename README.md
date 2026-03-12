# vite-scss-starter

Современный frontend starter для многостраничных сайтов с привычным БЭМ-подходом, `@@include`-шаблонами и отдельными командами под типовые задачи.

Сборщик переведён на современный стек, но концепция исходного проекта сохранена:

- страницы лежат в `src/views`
- БЭМ-блоки лежат в `src/blocks/modules` и `src/blocks/components`
- HTML блоков подключается прямо в страницы через `@@include(...)`
- SCSS блоков подключается через агрегаторы
- JS блоков подключается через `src/js/import`
- изображения, спрайты, WebP и favicon собираются отдельными командами

## Возможности

- БЭМ-структура проекта
- SCSS + PostCSS + Autoprefixer
- HTML partials через `@@include(...)`
- многостраничная сборка
- генерация SVG-спрайта
- оптимизация изображений
- генерация WebP
- генерация favicon
- генератор БЭМ-блоков и компонентов
- генератор новых страниц
- ESLint для JS
- Stylelint для SCSS/CSS
- Prettier для форматирования
- проверки перед коммитом через Husky + lint-staged
- smoke-тесты через Vitest

## Установка

1. Установите Node.js версии `18.20+`.
   Рекомендуется использовать `nvm`.
2. Клонируйте репозиторий:

```bash
git clone <repo-url>
cd vite-scss-starter
```

3. Установите зависимости:

```bash
npm install
```

4. Запустите режим разработки:

```bash
npm run dev
```

5. Для production-сборки используйте:

```bash
npm run build
```

Если всё настроено правильно, локальный сервер будет доступен по адресу `http://127.0.0.1:5173/`.

## Структура проекта

```text
vite-scss-starter
├── dist
├── public
│   └── img
├── scripts
├── src
│   ├── blocks
│   │   ├── components
│   │   ├── modules
│   │   ├── _components.scss
│   │   └── _modules.scss
│   ├── fonts
│   ├── img
│   │   ├── favicon
│   │   └── sprites
│   ├── js
│   │   ├── import
│   │   └── index.js
│   ├── styles
│   ├── views
│   │   ├── pages
│   │   │   └── page.html
│   │   ├── 404.html
│   │   └── index.html
├── eslint.config.mjs
├── postcss.config.js
├── package.json
└── vite.config.mjs
```

## Основная идея

### Страницы

- Все рабочие страницы лежат в `src/views`.
- Главная страница: `src/views/index.html`
- Страница 404: `src/views/404.html`
- Шаблон новой страницы: `src/views/pages/page.html`

Важно:

- `src/views/pages/page.html` не является отдельной страницей сайта.
- Это шаблон, который используется командой `new:page`.

### Блоки

- Каждый БЭМ-блок лежит в своей папке внутри `src/blocks/modules`.
- Каждый компонент лежит в `src/blocks/components`.
- У блока могут быть:
    - HTML-файл
    - SCSS-файл
    - JS-файл

Пример структуры блока:

```text
src/blocks/modules/hero
├── hero.html
├── hero.scss
└── hero.js
```

Если JS для блока не нужен, файл можно удалить и не импортировать.

### Подключение блока

HTML блока подключается прямо в страницу:

```html
@@include('../blocks/modules/hero/hero.html')
```

SCSS блока подключается в:

```text
src/blocks/_modules.scss
```

JS блока подключается в:

```text
src/js/import/modules.js
```

Именно такой поток и является основным для этого starter.

## Команды

### Основные

- `npm run dev` — запуск dev-сервера
- `npm run build` — production-сборка
- `npm run preview` — просмотр production-сборки

### Генерация блоков и страниц

- `npm run bem-m -- hero` — создать модуль `hero`
- `npm run bem-c -- button` — создать компонент `button`
- `npm run block -- --type=module hero` — то же самое, явный вариант
- `npm run block -- --type=module --page=index hero` — создать блок и сразу подключить его в `src/views/index.html`
- `npm run new:page -- about` — создать новую страницу `src/views/about.html` по шаблону
- `npm run new:page -- company-services` — создать страницу `company-services.html`

### Изображения и ассеты

- `npm run assets:prepare` — прогнать весь asset pipeline
- `npm run assets:sprites` — собрать SVG-спрайт
- `npm run assets:images` — оптимизировать изображения
- `npm run assets:webp` — сгенерировать WebP
- `npm run assets:favicons` — сгенерировать favicon

### Совместимые алиасы

- `npm run build:sprites`
- `npm run build:images`
- `npm run build:webp`
- `npm run build:favicons`

### Линтинг и форматирование

- `npm run lint` — проверить JS и стили
- `npm run lint:js` — проверить JS
- `npm run lint:scripts` — алиас для проверки JS
- `npm run lint:styles` — проверить стили
- `npm run lint:fix` — исправить доступные проблемы автоматически
- `npm run lint:scripts:fix` — исправить JS
- `npm run lint:styles:fix` — исправить стили
- `npm run format` — форматировать проект через Prettier
- `npm run format:check` — проверить форматирование
- `npm run test` — запустить smoke-тесты

## Как создавать новую страницу

1. Выполните команду:

```bash
npm run new:page -- about
```

2. Сборщик создаст файл:

```text
src/views/about.html
```

3. Откройте страницу и заполните `<main>`:

```html
<main class="main" role="main">@@include('../blocks/modules/hero/hero.html')</main>
```

4. Если нужен новый блок для этой страницы, создайте его:

```bash
npm run block -- --type=module --page=about about-hero
```

Эта команда:

- создаст папку блока
- создаст HTML, SCSS и JS файлы блока
- добавит SCSS блока в `src/blocks/_modules.scss`
- добавит JS блока в `src/js/import/modules.js`
- вставит `@@include(...)` блока в `src/views/about.html`

## Как создавать новый БЭМ-блок

Пример:

```bash
npm run bem-m -- promo
```

Будет создано:

```text
src/blocks/modules/promo
├── promo.html
├── promo.scss
└── promo.js
```

После этого автоматически обновятся:

- `src/blocks/_modules.scss`
- `src/js/import/modules.js`

Если указать `--page`, блок также автоматически подключится в нужную страницу.

Пример:

```bash
npm run block -- --type=module --page=index promo
```

## Как создавать новый компонент

Пример:

```bash
npm run bem-c -- button
```

Будет создано:

```text
src/blocks/components/button
├── button.html
├── button.scss
└── button.js
```

После этого автоматически обновятся:

- `src/blocks/_components.scss`
- `src/js/import/components.js`

## HTML partials

В проекте используется синтаксис:

```html
@@include('../blocks/modules/header/header.html')
```

Также можно передавать параметры:

```html
@@include('../blocks/modules/head/head.html', { "title": "Главная" })
```

Этот подход сохранён специально, чтобы работа со страницами и блоками оставалась такой же прямой и понятной, как в исходном starter.

## Изображения

Исходные изображения лежат в:

```text
src/img
```

Сгенерированные файлы попадают в:

```text
public/img
```

А затем копируются в `dist` при сборке.

### WebP

Чтобы собрать WebP:

```bash
npm run assets:webp
```

### Оптимизация изображений

Чтобы оптимизировать изображения:

```bash
npm run assets:images
```

## SVG-спрайты

SVG-иконки для спрайта должны лежать в:

```text
src/img/sprites
```

Сборка спрайта:

```bash
npm run assets:sprites
```

Результат:

```text
public/img/sprites/sprite.svg
```

Использование в HTML:

```html
<svg>
    <use xlink:href="/img/sprites/sprite.svg#icon-name"></use>
</svg>
```

Рекомендация:

- перед использованием очищайте SVG от лишних `fill`, `stroke` и инлайновых стилей, если хотите управлять цветом из CSS

## Favicons

Исходный файл favicon должен лежать в:

```text
src/img/favicon/favicon.png
```

Рекомендуемый размер:

- не меньше `1024x1024`

Команда генерации:

```bash
npm run assets:favicons
```

Результат:

```text
public/img/favicons
```

## Шрифты

Шрифты хранятся в:

```text
src/fonts
```

Подключение шрифтов выполняется в:

```text
src/styles/base/_fonts.scss
```

Рекомендуется использовать форматы:

- `.woff`
- `.woff2`

## Стили

Главный SCSS-файл:

```text
src/styles/main.scss
```

Токены вынесены в CSS custom properties через `:root`:

```text
src/styles/helpers/_variables.scss
```

SCSS-миксины и функции лежат в:

```text
src/styles/helpers
```

## Линтинг, форматирование и проверки перед коммитом

В проекте используются:

- ESLint
- Stylelint
- Prettier
- Husky
- lint-staged

Перед коммитом автоматически запускаются:

- линтинг изменённых файлов
- форматирование изменённых файлов
- `npm run test`

Это позволяет держать проект в чистом состоянии без ручной рутины.

## Рекомендованный сценарий работы

1. Запустить `npm run dev`
2. Создать страницу через `npm run new:page -- page-name`
3. Создать нужные блоки через `npm run bem-m -- block-name`
4. Подключать блоки в страницу через `@@include(...)`
5. Складывать изображения в `src/img`
6. При необходимости запускать `assets:*` команды
7. Перед коммитом прогонять:

```bash
npm run lint
npm run format:check
npm run test
```

## Что важно знать

- В исходниках страницы лежат в `src/views`, а не в корне проекта.
- В `dist` HTML-файлы складываются в корень сборки.
- `src/views/pages/page.html` нужен как шаблон для новых страниц.
- Лишние demo-layout файлы и промежуточные partial pages из проекта убраны.
- Starter ориентирован на быстрый запуск типовых многостраничных сайтов, а не на SPA-архитектуру.
