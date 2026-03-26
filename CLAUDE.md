# AI Assistant Rules for vite-scss-starter

You are working in `vite-scss-starter`. This is a modern static Multi-Page Application (MPA) built with Vite, utilizing Vanilla HTML, SCSS, Vanilla JS, and `@@include` for HTML templating. There is NO React, Vue, or any SPA framework involved.

Strictly adhere to the following rules:

## 1. 🏗 Architecture & File Structure

- **ALL code MUST be written in the `src/` directory.** NEVER suggest editing or modify files in `dist/` or `public/img/`—they are auto-generated.
- **Pages** are located in `src/views/`. The entry point is `index.html`.
- **Large blocks** (Headers, Footers, Sections) are located in `src/blocks/modules/`.
- **Small UI components** (Buttons, Inputs, Icons) are located in `src/blocks/components/`.

## 2. 🧩 HTML & Templating

- Use the `@@include` plugin to reuse HTML. Syntax: `@@include('../blocks/modules/header/header.html', { "title": "Value" })`.
- Do not duplicate HTML code across pages; abstract it into modules or components.

## 3. 🎨 Styles & BEM Methodology (CRITICAL)

- The project uses SCSS and a **Lightweight BEM** methodology.
- ✅ Allowed: `block__element`.
- ❌ FORBIDDEN (double nesting): `block__elem__subelem`. Never do this.
- **States:** Instead of BEM modifiers (`block__el--active`), use global state classes: `.is-active`, `.is-open`, `.is-hidden`, etc.
- **Spacing:** Utility classes for margins/padding (e.g., `.mb-20`, `.mt-40`) are allowed and encouraged. Do not create unique BEM modifiers just for spacing.
- The main stylesheet is `src/styles/main.scss`. CSS variables are stored in `:root` inside `src/styles/helpers/_variables.scss`.

## 4. ⚡ JavaScript

- No frameworks. Use Vanilla JS (ES6+).
- The main entry file is `src/js/main.js`.
- **Third-party libraries** (Swiper, GSAP, etc.) must be installed via `npm install` and imported directly into the block's JS file (e.g., `import Swiper from 'swiper';`), NOT via `<script src="cdn...">` in HTML. The bundler will automatically extract node_modules code into `vendor.min.js`.
- When a block requires JS, the code is written in its own file (e.g., `hero.js`). You **DO NOT** need to manually import this file anywhere—the project's CLI generators (bem-m/bem-c) automatically handle all necessary imports upon creation.

## 5. 🛠 Commands & Automation (CLI)

NEVER create folders or files for blocks/components/pages manually. ALWAYS suggest or use the built-in generators, as they automatically create the necessary structure and **write all required imports** (HTML inside the page, SCSS in `_modules.scss`, JS in `import/modules.js`):

- Create a new page: `npm run new:page -- <page_name>`
- Create a module (large block) and include it in a page: `npm run block -- --type=module --page=<page_name> <block_name>`
- Create a component (small UI): `npm run bem-c -- <component_name>`
- Image optimization & sprites: Use `npm run assets:*` commands (e.g., `npm run assets:sprites`).

## 6. 🚀 Build

- To run a production build without file hashes, use `npm run build:no-hash`. This generates clean filenames (`main.min.js`, `vendor.min.js`, `main.min.css`).

## 7. ♻️ Reuse Strategy (CRITICAL)

- Before creating a new block or component, ALWAYS check whether a similar one already exists in the project.
- If a similar block already exists, reuse it instead of duplicating markup, styles, or JS.
- If needed, extend the existing block carefully instead of creating a cloned variation.
- Only create a new block when the structure or purpose is substantially different.
- If differences are only in content, use `@@include` parameters.
- If differences are only in visual state or minor styling, use additional classes or global state classes.
- If unsure, prefer reuse over duplication.

## 8. General Principles

- Do not overengineer solutions.
- Prefer simple and direct implementations over unnecessary abstractions.
- Do not create new components, modules, or utility classes unless there is a clear benefit or reuse case.
- Do not rewrite existing code unless explicitly requested.
- Prefer extending existing code over replacing it.

## 9. HTML / CSS / JS Safety Rules

- Do NOT use inline styles.
- Do NOT use inline JavaScript in HTML.
- Keep HTML clean and readable.
- Avoid unnecessary wrappers, deep nesting, and duplicated structures.
- Use semantic HTML where appropriate.

## 10. Images & Assets

- Store source images and assets only in the appropriate `src/` assets directories.
- Never use files from `dist/` as source assets.
- Do not place new source images into auto-generated folders.
- Use the project's asset optimization commands when needed.

## 11. Naming Conventions

- Use clear, short, and semantic names for pages, modules, components, classes, and files.
- Avoid vague names such as `block`, `item`, `wrapper`, `section2`, `temp`, `new-block`.
- Naming should reflect the role of the block in the interface.

## 12. When Updating Existing Blocks

- Before modifying a block, check where else it is used.
- Do not introduce breaking changes for other pages or modules.
- If a shared block needs page-specific changes, prefer configurable parameters, additional classes, or a carefully scoped extension.
- Do not fork an existing block into a duplicate unless absolutely necessary.

## 13. Output Behavior

- Focus on the requested change only.
- Do not propose unrelated refactoring.
- Do not add explanatory text inside code files.
- Preserve the existing project structure and coding style.
