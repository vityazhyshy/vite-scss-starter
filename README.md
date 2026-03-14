# vite-scss-starter

Современный frontend starter для многостраничных сайтов с привычным БЭМ-подходом, `@@include`-шаблонами и отдельными командами под типовые задачи.

Сборщик переведён на современный стек, но концепция исходного проекта сохранена:

- страницы лежат в `src/views`
- БЭМ-блоки лежат в `src/blocks/modules` и `src/blocks/components`
- HTML блоков подключается прямо в страницы через `@@include(...)`
- SCSS блоков подключается через агрегаторы
- JS блоков подключается через `src/js/import`
- изображения, спрайты, WebP и favicon собираются отдельными командами

## 📌 Оглавление

1. [Возможности](#-возможности)
2. [Установка](#-установка)
3. [Быстрый старт за 5 минут](#-быстрый-старт-за-5-минут)
4. [Где писать код? (Важно!)](#-где-писать-код-важно)
5. [Словарь терминов сборки](#-словарь-терминов-сборки)
6. [Структура проекта](#-структура-проекта)
7. [Как создавать новую страницу](#-как-создавать-новую-страницу)
8. [Как создавать новый БЭМ-блок](#-как-создавать-новый-бэм-блок)
9. [Как создавать новый компонент](#-как-создавать-новый-компонент)
10. [Как подключать сторонние библиотеки](#-как-подключать-сторонние-библиотеки-swiper-gsap-bootstrap)
11. [Основная идея](#-основная-идея)
12. [Команды](#-команды)
13. [Шрифты](#-шрифты)
14. [Изображения, SVG-спрайты и Favicons](#-изображения)
15. [Линтинг, форматирование и проверки перед коммитом](#-линтинг-форматирование-и-проверки-перед-коммитом)
16. [Рекомендованный сценарий работы](#-рекомендованный-сценарий-работы)
17. [Что важно знать](#-что-важно-знать)

## ⚡ Возможности

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

## 📦 Установка

1. Установите Node.js версии `18.20+`.
   Рекомендуется использовать `nvm`.
2. Клонируйте репозиторий:

```bash
git clone https://github.com/vityazhyshy/vite-scss-starter.git
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

## 🚀 Быстрый старт за 5 минут

Давайте создадим вашу первую страницу с новым блоком, чтобы понять, как всё работает:

1. **Запустите проект:**
   Отройте терминал в папке проекта и введите: `npm run dev`. 
   Перейдите в браузере по ссылке `http://localhost:5173`. Вы увидите стартовую страницу. Не закрывайте этот терминал!
2. **Создайте новую страницу:**
   Откройте **новую** вкладку терминала (в этой же папке) и введите:
   `npm run new:page -- my-test`
   Сборщик создаст файл `src/views/my-test.html`.
3. **Создайте новый блок для этой страницы:**
   В терминале введите:
   `npm run block -- --type=module --page=my-test welcome-banner`
   Сборщик сам создаст HTML, CSS и JS для блока `welcome-banner` и сразу подключит его к странице `my-test.html`.
4. **Проверьте результат:**
   Зайдите в `src/blocks/modules/welcome-banner/welcome-banner.html`, напишите там `<h1>Привет, мир!</h1>`.
   Откройте в браузере `http://localhost:5173/my-test.html` и вы увидите свой новый блок!

## 📁 Структура проекта

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

## 🛑 Где писать код? (Важно!)

- **ВЕСЬ ваш код (HTML, CSS, JS) пишется ТОЛЬКО в папке `src/`.**
- **НИКОГДА** не редактируйте файлы в папках `dist/` или `public/img/`. Папка `dist` перезаписывается при каждой сборке проекта, а `public/img` обновляется автоматически из `src/img`.
- **Изображения** кладем в `src/img/`. После запуска оптимизации они автоматически попадут в `public/img/`.

## 📖 Словарь терминов сборки

В сборке используется БЭМ-подход. Ваши блоки делятся на две папки:
- **Модули (`src/blocks/modules`)** — это крупные, самостоятельные части страницы (Шапка, Подвал, Секция со слайдером, Блок с тарифами).
- **Компоненты (`src/blocks/components`)** — это мелкие элементы, которые могут переиспользоваться внутри модулей (Кнопка, Поле ввода, Декоративная иконка).
- **`@@include`** — это специальная команда, которая говорит сборщику: "Возьми кусок HTML-кода из другого файла и вставь его сюда". Это позволяет, например, не копировать один и тот же код шапки на 10 разных страниц, а подключить его одной строчкой.

## 💡 Основная идея

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

## 💻 Команды

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

## 📄 Как создавать новую страницу

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

## 🧱 Как создавать новый БЭМ-блок

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

## 🧩 Как создавать новый компонент

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

## 🖼️ Изображения

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

### 🎯 SVG-спрайты

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

### 🌟 Favicons

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

## 🔠 Шрифты

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

## 🎨 Стили

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

## 📦 Как подключать сторонние библиотеки (Swiper, GSAP, Bootstrap)

Современная сборка подразумевает, что вы **не скачиваете** архивы с библиотеками вручную и не кидаете их в папку проекта. Вы устанавливаете их через терминал (npm). 

### Сценарий 1: Локальное подключение библиотеки (Правильный путь)
Идеальный вариант для Vite-сборок. Код библиотеки попадает только туда, где он реально нужен, не утяжеляя остальной сайт.

1. **Установите нужный пакет.** Откройте терминал в корне проекта и напишите:
   ```bash
   npm install swiper
   ```
2. **Импортируйте библиотеку в нужном блоке.** Например, в `src/blocks/modules/hero/hero.js`:
   ```javascript
   // Подключаем JS
   import Swiper from 'swiper';
   import { Navigation, Pagination } from 'swiper/modules';
   
   // Подключаем CSS (Vite сам разберется, что это стили)
   import 'swiper/css';
   import 'swiper/css/navigation';
   import 'swiper/css/pagination';

   // Инициализируем 
   const swiper = new Swiper('.hero__slider', {
       modules: [Navigation, Pagination],
       loop: true
   });
   ```

### Сценарий 2: Глобальное подключение (Если библиотека нужна везде)
Если вы используете GSAP для анимаций по всему сайту на каждой странице, или Bootstrap сетку.
1. Установите библиотеку: `npm install gsap`
2. Откройте `src/js/index.js` (главный входной файл JS) и подключите там:
   ```javascript
   import { gsap } from "gsap";
   import { ScrollTrigger } from "gsap/ScrollTrigger";
   
   gsap.registerPlugin(ScrollTrigger);
   
   // Теперь вы можете использовать gsap в любых js-файлах своих блоков!
   ```

### Сценарий 3: "Мне нужен доступ к библиотекам после натяжки на CMS"
Иногда бывает так, что вы отдаете верстку бэкендеру, он натягивает её на WordPress/Битрикс, и там нужно "дописать" инициализацию слайдера прямо в `<script>` на странице, а исходников сборки уже нет (только собранный `dist`).

По умолчанию Vite прячет весь ваш JS внутрь модулей, и переменная `Swiper` не видна в консоли разработчика. Чтобы починить это, нужно "вытащить" библиотеку в глобальную область видимости (сделать её доступной из объекта `window`).

1. Установите библиотеку: `npm install swiper`
2. В файле `src/js/index.js` привяжите библиотеку к `window`:
   ```javascript
   import Swiper from 'swiper';
   import { Navigation, Pagination } from 'swiper/modules';
   import 'swiper/css/bundle'; // подключаем все стили сразу, если не знаем, какие понадобятся в будущем
   
   // Делаем Swiper глобальным!
   window.Swiper = Swiper;
   window.Navigation = Navigation;
   window.Pagination = Pagination;
   ```
3. Теперь, даже на собранном сайте без исходников, любой программист (или вы сами) сможете написать в HTML:
   ```html
   <script>
       // Сработает, потому что Swiper глобальный
       const mySlider = new Swiper('.slider', {
           modules: [Navigation, Pagination]
       });
   </script>
   ```

## 🛡️ Линтинг, форматирование и проверки перед коммитом

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

## ✅ Рекомендованный сценарий работы

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

## ⚠️ Что важно знать

- В исходниках страницы лежат в `src/views`, а не в корне проекта.
- В `dist` HTML-файлы складываются в корень сборки.
- `src/views/pages/page.html` нужен как шаблон для новых страниц.
- Лишние demo-layout файлы и промежуточные partial pages из проекта убраны.
- Starter ориентирован на быстрый запуск типовых многостраничных сайтов, а не на SPA-архитектуру.
