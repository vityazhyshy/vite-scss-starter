import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

function toPascalCase(value) {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("");
}

function normalizeName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "");
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function ensureFile(filePath, contents) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, contents);
    }
}

async function appendUnique(filePath, line) {
    let current = "";

    try {
        current = await fs.readFile(filePath, "utf8");
    } catch {
        await fs.writeFile(filePath, "");
    }

    if (current.includes(line)) {
        return;
    }

    const next = `${current.trimEnd()}\n${line}\n`.replace(/^\n/, "");
    await fs.writeFile(filePath, next);
}

async function insertBlockInclude(pagePath, includeLine) {
    let current;

    try {
        current = await fs.readFile(pagePath, "utf8");
    } catch {
        console.error(`Page "${path.basename(pagePath)}" not found in src/views.`);
        process.exitCode = 1;
        return false;
    }

    if (current.includes(includeLine)) {
        return true;
    }

    const closingMainPattern = /^(\s*)<\/main>/m;
    const match = current.match(closingMainPattern);

    if (!match) {
        const next = `${current.trimEnd()}\n${includeLine}\n`;
        await fs.writeFile(pagePath, next);
        return true;
    }

    const indent = match[1];
    const insertion = `${indent}    ${includeLine}\n\n${indent}</main>`;
    const next = current.replace(closingMainPattern, insertion);
    await fs.writeFile(pagePath, next);
    return true;
}

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            type: {
                type: "string",
                default: "module"
            },
            name: {
                type: "string"
            },
            page: {
                type: "string",
                default: "index"
            }
        },
        allowPositionals: true
    });

    const rawName = values.name ?? positionals[0];

    if (!rawName) {
        console.error("Usage: npm run block -- --type=module hero");
        process.exitCode = 1;
        return;
    }

    const type = values.type === "component" ? "components" : "modules";
    const name = normalizeName(rawName);

    if (!name) {
        console.error("Block name must contain latin letters, numbers or hyphens.");
        process.exitCode = 1;
        return;
    }

    const blockDir = path.join(rootDir, "src", "blocks", type, name);
    const htmlPath = path.join(blockDir, `${name}.html`);
    const scssPath = path.join(blockDir, `${name}.scss`);
    const jsPath = path.join(blockDir, `${name}.js`);
    const aggregatorPath = path.join(rootDir, "src", "blocks", `_${type}.scss`);
    const jsImportFile = path.join(rootDir, "src", "js", "import", `${type}.js`);
    const pageName = normalizeName(values.page);
    const displayName = toPascalCase(name);

    await ensureDir(blockDir);
    await ensureDir(path.dirname(jsImportFile));

    await ensureFile(
        htmlPath,
        `<section class="${name}">\n    <div class="container">\n        <h2>${displayName}</h2>\n    </div>\n</section>\n`
    );
    await ensureFile(scssPath, `.${name} {\n}\n`);
    await ensureFile(
        jsPath,
        `const ${displayName} = document.querySelector(".${name}");\n\nif (${displayName}) {\n    // Block logic goes here.\n}\n`
    );
    await ensureFile(aggregatorPath, "");
    await ensureFile(jsImportFile, "");

    await appendUnique(aggregatorPath, `@use "${type}/${name}/${name}";`);
    await appendUnique(jsImportFile, `import "%${type}%/${name}/${name}";`);
    const pageFilePath = path.join(rootDir, "src", "views", `${pageName}.html`);
    const includeLine = `@@include("../blocks/${type}/${name}/${name}.html")`;
    const inserted = await insertBlockInclude(pageFilePath, includeLine);

    if (!inserted) {
        return;
    }

    console.log(
        `[block] created ${type.slice(0, -1)} "${name}" and linked it to page "${pageName}.html"`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
