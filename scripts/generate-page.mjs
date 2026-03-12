import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

function normalizeName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "");
}

function toTitle(value) {
    return value
        .split("-")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            name: {
                type: "string"
            },
            title: {
                type: "string"
            }
        },
        allowPositionals: true
    });

    const rawName = values.name ?? positionals[0];

    if (!rawName) {
        console.error("Usage: npm run new:page -- about");
        process.exitCode = 1;
        return;
    }

    const name = normalizeName(rawName);

    if (!name) {
        console.error("Page name must contain latin letters, numbers or hyphens.");
        process.exitCode = 1;
        return;
    }

    const title = values.title?.trim() || toTitle(name);
    const entryPath = path.join(rootDir, "src", "views", `${name}.html`);
    const templatePath = path.join(rootDir, "src", "views", "pages", "page.html");

    await ensureDir(path.dirname(entryPath));

    try {
        await fs.access(entryPath);
        console.error(`Page "${name}" already exists.`);
        process.exitCode = 1;
        return;
    } catch {
        const template = await fs.readFile(templatePath, "utf8");
        const output = template.replace(/@@title/g, title).replace(/__BLOCKS_PATH__/g, "../blocks");
        await fs.writeFile(entryPath, output);
    }

    console.log(`[page] created "${name}" from src/views/pages/page.html`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
