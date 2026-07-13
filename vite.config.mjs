import { defineConfig } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";
import * as prettier from "prettier";
import { prepareAssets } from "./scripts/assets.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const partialsRoot = path.resolve(rootDir, "src");
const viewsRoot = path.resolve(rootDir, "src/views");
const buildLockPath = path.resolve(rootDir, ".vite-build.lock");

function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        if (error.code === "ESRCH") {
            return false;
        }

        return true;
    }
}

async function acquireBuildLock() {
    const lockPayload = JSON.stringify(
        {
            pid: process.pid,
            startedAt: new Date().toISOString()
        },
        null,
        2
    );

    try {
        const handle = await fs.open(buildLockPath, "wx");
        await handle.writeFile(lockPayload);
        await handle.close();
        return;
    } catch (error) {
        if (error.code !== "EEXIST") {
            throw error;
        }
    }

    try {
        const existingLock = JSON.parse(await fs.readFile(buildLockPath, "utf8"));

        if (!existingLock.pid || !isProcessRunning(existingLock.pid)) {
            await fs.rm(buildLockPath, { force: true });
            return acquireBuildLock();
        }

        throw new Error(
            `Another build is already running (pid ${existingLock.pid}). Wait for it to finish before starting a new build.`
        );
    } catch (error) {
        if (error.code === "ENOENT") {
            return acquireBuildLock();
        }

        if (error instanceof SyntaxError) {
            await fs.rm(buildLockPath, { force: true });
            return acquireBuildLock();
        }

        throw error;
    }
}

async function releaseBuildLock() {
    await fs.rm(buildLockPath, { force: true });
}

function replaceTemplateTokens(source, context) {
    return source.replace(
        /@@(?!include\s*\()([a-zA-Z0-9_-]+)/g,
        (_, key) => `${context[key] ?? ""}`
    );
}

async function resolveHtmlIncludes(source, fromFile, context = {}) {
    const includePattern = /@@include\(\s*["'](.+?)["']\s*(?:,\s*({[\s\S]*?}))?\s*\)/g;
    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = includePattern.exec(source)) !== null) {
        result += source.slice(lastIndex, match.index);

        const rawContext = match[2];
        const nestedContext = rawContext ? JSON.parse(rawContext) : {};
        const mergedContext = {
            ...context,
            ...nestedContext
        };
        const includePath = replaceTemplateTokens(match[1], mergedContext);
        const absolutePath = path.resolve(path.dirname(fromFile), includePath);
        const partialSource = await fs.readFile(absolutePath, "utf8");
        const compiledPartial = await resolveHtmlIncludes(
            replaceTemplateTokens(partialSource, mergedContext),
            absolutePath,
            mergedContext
        );

        result += compiledPartial;
        lastIndex = includePattern.lastIndex;
    }

    result += source.slice(lastIndex);

    return replaceTemplateTokens(result, context);
}

function partialsPlugin() {
    return {
        name: "legacy-partials",
        transformIndexHtml: {
            order: "pre",
            async handler(html, ctx) {
                const currentFile = ctx.filename ?? path.resolve(rootDir, "index.html");

                return resolveHtmlIncludes(html, currentFile);
            }
        },
        configureServer(server) {
            server.watcher.add(path.join(partialsRoot, "**/*.html"));
            server.middlewares.use(async (req, res, next) => {
                const url = req.url?.split("?")[0] ?? "/";
                const normalized = url === "/" ? "/index.html" : url;
                const candidate = path.resolve(viewsRoot, `.${normalized}`);

                try {
                    const stats = await fs.stat(candidate);

                    if (!stats.isFile()) {
                        next();
                        return;
                    }

                    const source = await fs.readFile(candidate, "utf8");
                    const transformed = await resolveHtmlIncludes(source, candidate);
                    const html = await server.transformIndexHtml(
                        normalized,
                        transformed,
                        req.originalUrl
                    );

                    res.setHeader("Content-Type", "text/html");
                    res.end(html);
                    return;
                } catch {
                    next();
                }
            });
            server.watcher.on("change", (filePath) => {
                if (filePath.endsWith(".html") && filePath.startsWith(partialsRoot)) {
                    server.ws.send({ type: "full-reload" });
                }
            });
        }
    };
}

function assetPipelinePlugin() {
    let runningTask = Promise.resolve();

    const run = () => {
        runningTask = runningTask
            .then(() => prepareAssets())
            .catch((error) => {
                console.error("[assets]", error);
            });

        return runningTask;
    };

    return {
        name: "asset-pipeline",
        buildStart() {
            return run();
        },
        configureServer(server) {
            server.watcher.add(path.join(srcAssetsDir, "**/*"));
            server.watcher.on("add", (filePath) => {
                if (filePath.startsWith(srcAssetsDir)) {
                    run();
                }
            });
            server.watcher.on("change", (filePath) => {
                if (filePath.startsWith(srcAssetsDir)) {
                    run();
                }
            });
            server.watcher.on("unlink", (filePath) => {
                if (filePath.startsWith(srcAssetsDir)) {
                    run();
                }
            });
        }
    };
}

function flattenHtmlEntriesPlugin() {
    return {
        name: "flatten-html-entries",
        async writeBundle(outputOptions) {
            const outDir = outputOptions.dir ?? path.resolve(rootDir, "dist");
            const nestedViewsDir = path.join(outDir, "src", "views");
            const htmlEntries = await fg("*.html", {
                cwd: nestedViewsDir,
                onlyFiles: true
            }).catch(() => []);
            const prettierOptions = (await prettier.resolveConfig(rootDir)) ?? {};

            for (const entryName of htmlEntries) {
                const fromPath = path.join(nestedViewsDir, entryName);
                const toPath = path.join(outDir, path.basename(entryName));

                await fs.rename(fromPath, toPath);

                const html = await fs.readFile(toPath, "utf8");
                const formattedHtml = await prettier.format(html, {
                    ...prettierOptions,
                    filepath: toPath,
                    parser: "html"
                });

                await fs.writeFile(toPath, formattedHtml);
            }

            if (htmlEntries.length > 0) {
                await fs.rm(path.join(outDir, "src"), {
                    force: true,
                    recursive: true
                });
            }
        }
    };
}

function buildLockPlugin() {
    let hasLock = false;

    return {
        name: "build-lock",
        apply: "build",
        async buildStart() {
            await acquireBuildLock();
            hasLock = true;
        },
        async buildEnd() {
            if (hasLock) {
                await releaseBuildLock();
                hasLock = false;
            }
        },
        async closeBundle() {
            if (hasLock) {
                await releaseBuildLock();
                hasLock = false;
            }
        }
    };
}

const srcAssetsDir = path.resolve(rootDir, "src/assets");
const htmlEntries = Object.fromEntries(
    fg
        .sync("src/views/*.html", {
            cwd: rootDir,
            absolute: true
        })
        .map((entryPath) => [path.basename(entryPath, ".html"), entryPath])
);

export default defineConfig(({ mode }) => ({
    plugins: [
        buildLockPlugin(),
        ...(mode === "test" ? [] : [assetPipelinePlugin()]),
        partialsPlugin(),
        flattenHtmlEntriesPlugin()
    ],
    server: {
        host: true,
        open: true
    },
    preview: {
        host: true
    },
    resolve: {
        alias: {
            "@": path.resolve(rootDir, "src"),
            "%modules%": path.resolve(rootDir, "src/blocks/modules"),
            "%components%": path.resolve(rootDir, "src/blocks/components")
        }
    },
    css: {
        postcss: "./postcss.config.js",
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
                additionalData: `@use "@/styles/helpers/_mixins.scss" as *;@use "@/styles/helpers/_functions.scss" as *;`
            }
        }
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: htmlEntries,
            output: {
                entryFileNames: () => {
                    const noHash = process.env.NO_HASH === "true";
                    return noHash ? "assets/js/[name].min.js" : "assets/js/[name]-[hash].min.js";
                },
                chunkFileNames: () => {
                    const noHash = process.env.NO_HASH === "true";
                    return noHash ? "assets/js/[name].min.js" : "assets/js/[name]-[hash].min.js";
                },
                assetFileNames: (assetInfo) => {
                    const noHash = process.env.NO_HASH === "true";
                    const fileName = assetInfo.names?.[0] || assetInfo.name || "";
                    const extType = fileName.split(".").pop();
                    if (extType === "css") {
                        return noHash
                            ? "assets/styles/main.min.css"
                            : "assets/styles/main-[hash].min.css";
                    }
                    return noHash
                        ? `assets/${extType}/[name].[ext]`
                        : `assets/${extType}/[name]-[hash].[ext]`;
                },
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                }
            }
        }
    }
}));
