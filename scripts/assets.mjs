import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import fg from "fast-glob";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const srcImgDir = path.join(rootDir, "src", "img");
const publicDir = path.join(rootDir, "public");
const publicImgDir = path.join(publicDir, "img");
const faviconSource = path.join(srcImgDir, "favicon", "favicon.png");
const spriteSourceDir = path.join(srcImgDir, "sprites");

const rasterExtensions = new Set([".jpg", ".jpeg", ".png"]);
const passthroughExtensions = new Set([".gif", ".webp", ".avif"]);

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function emptyDir(dirPath) {
    await fs.rm(dirPath, { recursive: true, force: true });
    await ensureDir(dirPath);
}

async function writeFileEnsured(targetPath, contents) {
    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, contents);
}

export async function buildSprites() {
    const { default: SVGSpriter } = await import("svg-sprite");
    const files = await fg("**/*.svg", {
        cwd: spriteSourceDir,
        absolute: true,
        onlyFiles: true
    });

    const outDir = path.join(publicImgDir, "sprites");
    await emptyDir(outDir);

    if (files.length === 0) {
        return { task: "sprites", count: 0, skipped: true };
    }

    const spriter = new SVGSpriter({
        dest: outDir,
        mode: {
            symbol: {
                sprite: "sprite.svg"
            }
        },
        shape: {
            transform: [
                {
                    svgo: {
                        plugins: [
                            {
                                name: "preset-default",
                                params: {
                                    overrides: {
                                        removeViewBox: false
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        },
        svg: {
            xmlDeclaration: false,
            doctypeDeclaration: false
        }
    });

    for (const filePath of files) {
        const relativePath = path.relative(spriteSourceDir, filePath);
        spriter.add(filePath, relativePath, await fs.readFile(filePath, "utf8"));
    }

    const result = await new Promise((resolve, reject) => {
        spriter.compile((error, compiled) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(compiled);
        });
    });

    const mode = result.symbol;
    const resource = mode.sprite;
    const targetPath = path.join(outDir, "sprite.svg");
    await writeFileEnsured(targetPath, resource.contents);

    return { task: "sprites", count: files.length, outDir };
}

export async function optimizeImages() {
    const { default: sharp } = await import("sharp");
    const { optimize: optimizeSvg } = await import("svgo");
    const files = await fg("**/*.{jpg,jpeg,png,gif,svg,avif,webp}", {
        cwd: srcImgDir,
        absolute: true,
        onlyFiles: true,
        ignore: ["favicon/**", "sprites/**"]
    });

    const copied = [];

    for (const filePath of files) {
        const relativePath = path.relative(srcImgDir, filePath);
        const targetPath = path.join(publicImgDir, relativePath);
        const extension = path.extname(filePath).toLowerCase();

        await ensureDir(path.dirname(targetPath));

        if (extension === ".svg") {
            const input = await fs.readFile(filePath, "utf8");
            const output = optimizeSvg(input, {
                path: filePath,
                plugins: [
                    {
                        name: "preset-default",
                        params: {
                            overrides: {
                                removeViewBox: false
                            }
                        }
                    }
                ]
            });
            await fs.writeFile(targetPath, output.data);
            copied.push(targetPath);
            continue;
        }

        if (rasterExtensions.has(extension)) {
            let pipeline = sharp(filePath);

            if (extension === ".jpg" || extension === ".jpeg") {
                pipeline = pipeline.jpeg({
                    quality: 82,
                    mozjpeg: true
                });
            } else if (extension === ".png") {
                pipeline = pipeline.png({
                    compressionLevel: 9,
                    palette: true
                });
            }

            await pipeline.toFile(targetPath);
            copied.push(targetPath);
            continue;
        }

        if (passthroughExtensions.has(extension)) {
            await fs.copyFile(filePath, targetPath);
            copied.push(targetPath);
        }
    }

    return { task: "images", count: copied.length };
}

export async function generateWebp() {
    const { default: sharp } = await import("sharp");
    const files = await fg("**/*.{jpg,jpeg,png}", {
        cwd: srcImgDir,
        absolute: true,
        onlyFiles: true,
        ignore: ["favicon/**", "sprites/**"]
    });

    const generated = [];

    for (const filePath of files) {
        const relativePath = path.relative(srcImgDir, filePath);
        const targetPath = path
            .join(publicImgDir, relativePath)
            .replace(/\.(png|jpe?g)$/i, ".webp");

        await ensureDir(path.dirname(targetPath));
        await sharp(filePath)
            .webp({
                quality: 84
            })
            .toFile(targetPath);

        generated.push(targetPath);
    }

    return { task: "webp", count: generated.length };
}

export async function generateFavicons() {
    const { favicons } = await import("favicons");
    const outDir = path.join(publicImgDir, "favicons");
    await emptyDir(outDir);

    try {
        await fs.access(faviconSource);
    } catch {
        return { task: "favicons", count: 0, skipped: true };
    }

    const response = await favicons(faviconSource, {
        appName: "Vite SCSS Starter",
        appShortName: "Starter",
        appDescription: "Modern multipage frontend starter",
        background: "#ffffff",
        theme_color: "#0f172a",
        path: "/img/favicons/",
        display: "standalone",
        orientation: "portrait",
        icons: {
            android: true,
            appleIcon: true,
            appleStartup: false,
            favicons: true,
            windows: false,
            yandex: false,
            firefox: false,
            coast: false
        }
    });

    for (const image of response.images) {
        await writeFileEnsured(path.join(outDir, image.name), image.contents);
    }

    for (const file of response.files) {
        await writeFileEnsured(path.join(outDir, file.name), file.contents);
    }

    await writeFileEnsured(path.join(outDir, "meta.html"), response.html.join("\n"));

    return {
        task: "favicons",
        count: response.images.length + response.files.length
    };
}

export async function prepareAssets() {
    const commands = ["sprites", "images", "webp", "favicons"];
    const results = [];

    for (const command of commands) {
        results.push(await runSubcommand(command));
    }

    return results;
}

async function runSubcommand(command) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [currentPath, command], {
            cwd: rootDir,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            stdout += text;
            process.stdout.write(text);
        });

        child.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            stderr += text;
            process.stderr.write(text);
        });

        child.on("exit", (code) => {
            if (code === 0) {
                resolve({ task: command, count: 0, log: stdout.trim() });
                return;
            }

            reject(new Error(stderr || stdout || `assets command failed: ${command}`));
        });
    });
}

async function main() {
    const { positionals } = parseArgs({
        allowPositionals: true
    });

    const command = positionals[0] ?? "prepare";
    const tasks = {
        prepare: prepareAssets,
        sprites: buildSprites,
        images: optimizeImages,
        webp: generateWebp,
        favicons: generateFavicons
    };

    const task = tasks[command];

    if (!task) {
        console.error(`Unknown assets command: ${command}`);
        process.exitCode = 1;
        return;
    }

    const result = await task();

    if (command === "prepare") {
        return;
    }

    const payload = Array.isArray(result) ? result : [result];

    for (const item of payload) {
        const suffix = item.skipped ? "skipped" : `${item.count} files`;
        console.log(`[assets] ${item.task}: ${suffix}`);
    }
}

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = fileURLToPath(import.meta.url);

if (scriptPath === currentPath) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
