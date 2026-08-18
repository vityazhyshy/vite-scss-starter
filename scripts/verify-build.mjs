import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "dist");
const forbiddenImageDirs = ["jpg", "jpeg", "png", "svg", "webp"];
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "ico"]);
const forbiddenRasterExtensions = new Set(["jpg", "jpeg", "png"]);
const starterManifestValues = ["Vite SCSS Starter", "Starter", "Modern multipage frontend starter"];
const requiredManifestFields = [
    "name",
    "short_name",
    "description",
    "lang",
    "theme_color",
    "background_color",
    "start_url",
    "icons"
];

function fail(message) {
    throw new Error(`[verify-build] ${message}`);
}

function getExtension(filePath) {
    return path.extname(filePath).slice(1).toLowerCase();
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function getHtmlUrls(html) {
    const urls = [];
    const attributePattern = /\b(src|srcset|href|data-[a-zA-Z0-9_:-]+)\s*=\s*(["'])(.*?)\2/g;
    let match;

    while ((match = attributePattern.exec(html)) !== null) {
        const [, attributeName, , value] = match;

        if (attributeName === "srcset") {
            urls.push(
                ...value
                    .split(",")
                    .map((candidate) => candidate.trim().split(/\s+/)[0])
                    .filter(Boolean)
            );
            continue;
        }

        urls.push(value);
    }

    return urls;
}

function stripQueryAndHash(url) {
    return url.replace(/[?#].*$/, "");
}

function isPublicFaviconUrl(url) {
    const pathname = stripQueryAndHash(url);
    return pathname.startsWith("/img/favicons/") || pathname.startsWith("img/favicons/");
}

async function verifyForbiddenImageDirs() {
    for (const dirName of forbiddenImageDirs) {
        const dirPath = path.join(distDir, "assets", dirName);

        if (await pathExists(dirPath)) {
            fail(`forbidden directory exists: dist/assets/${dirName}`);
        }
    }
}

async function verifyImagesDirectory() {
    const assetFiles = await fg("assets/**/*", {
        cwd: distDir,
        onlyFiles: true
    });

    for (const filePath of assetFiles) {
        const extType = getExtension(filePath);

        if (imageExtensions.has(extType) && !normalizePath(filePath).startsWith("assets/images/")) {
            fail(`image asset is outside dist/assets/images: ${filePath}`);
        }
    }
}

async function verifyHtmlImageUrls() {
    const htmlFiles = await fg("*.html", {
        cwd: distDir,
        onlyFiles: true
    });
    const webpUrls = [];

    for (const filePath of htmlFiles) {
        const html = await fs.readFile(path.join(distDir, filePath), "utf8");
        const urls = getHtmlUrls(html);

        for (const rawUrl of urls) {
            const pathname = stripQueryAndHash(rawUrl);
            const extType = getExtension(pathname);

            if (forbiddenRasterExtensions.has(extType) && !isPublicFaviconUrl(pathname)) {
                fail(`HTML contains raster source instead of WebP: ${filePath} -> ${rawUrl}`);
            }

            if (extType === "webp") {
                webpUrls.push({ filePath, rawUrl, pathname });
            }
        }
    }

    for (const { filePath, rawUrl, pathname } of webpUrls) {
        const outputPath = pathname.replace(/^\/+/, "");

        if (!(await pathExists(path.join(distDir, outputPath)))) {
            fail(`HTML references missing WebP file: ${filePath} -> ${rawUrl}`);
        }
    }
}

async function verifyManifest() {
    const manifestFiles = await fg("**/*.{webmanifest,json}", {
        cwd: path.join(distDir, "img", "favicons"),
        onlyFiles: true
    }).catch(() => []);

    for (const filePath of manifestFiles) {
        const manifest = JSON.parse(
            await fs.readFile(path.join(distDir, "img", "favicons", filePath), "utf8")
        );
        const serialized = JSON.stringify(manifest);

        for (const field of requiredManifestFields) {
            if (!(field in manifest)) {
                fail(`manifest is missing required field "${field}" in ${filePath}`);
            }
        }

        if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
            fail(`manifest has no icons in ${filePath}`);
        }

        for (const value of starterManifestValues) {
            if (serialized.includes(value)) {
                fail(`manifest contains starter test value "${value}" in ${filePath}`);
            }
        }
    }
}

async function main() {
    await verifyForbiddenImageDirs();
    await verifyImagesDirectory();
    await verifyHtmlImageUrls();
    await verifyManifest();

    console.log("[verify-build] OK");
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
