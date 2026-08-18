import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "ico"]);
export const rasterWebpSourceExtensions = new Set(["jpg", "jpeg", "png"]);
export const fontExtensions = new Set(["woff", "woff2", "ttf", "otf", "eot"]);

export const webpOptions = {
    quality: 85
};

function normalizePath(value) {
    return value.split(path.sep).join("/");
}

function stripQueryAndHash(url) {
    const match = url.match(/^([^?#]*)([?#].*)?$/);
    return {
        pathname: match?.[1] ?? url,
        suffix: match?.[2] ?? ""
    };
}

function getExtension(fileName) {
    return path.extname(stripQueryAndHash(fileName).pathname).slice(1).toLowerCase();
}

function getAssetOriginalName(assetInfo) {
    return assetInfo.originalFileNames?.[0] || assetInfo.names?.[0] || assetInfo.name || "";
}

function getImagesRelativeDir(fileName, rootDir) {
    const normalizedFileName = normalizePath(fileName);
    const normalizedRoot = normalizePath(rootDir);
    const srcImagesMarker = "src/assets/images/";
    const markerIndex = normalizedFileName.indexOf(srcImagesMarker);

    if (markerIndex !== -1) {
        const relativePath = normalizedFileName.slice(markerIndex + srcImagesMarker.length);
        return path.posix.dirname(relativePath) === "." ? "" : path.posix.dirname(relativePath);
    }

    if (path.isAbsolute(fileName)) {
        const relativePath = normalizePath(
            path.relative(path.join(rootDir, "src/assets/images"), fileName)
        );
        if (!relativePath.startsWith("..")) {
            return path.posix.dirname(relativePath) === "." ? "" : path.posix.dirname(relativePath);
        }
    }

    if (normalizedFileName.startsWith(`${normalizedRoot}/src/assets/images/`)) {
        const relativePath = normalizedFileName.slice(
            `${normalizedRoot}/src/assets/images/`.length
        );
        return path.posix.dirname(relativePath) === "." ? "" : path.posix.dirname(relativePath);
    }

    return "";
}

function assertNoDuplicateNoHashOutput(actualOutputPath, sourceName, registry) {
    const existingSource = registry.get(actualOutputPath);

    if (existingSource && existingSource !== sourceName) {
        throw new Error(
            `Duplicate no-hash asset output "${actualOutputPath}" from "${existingSource}" and "${sourceName}". ` +
                "Move one image into a different src/assets/images subdirectory or enable hashed build."
        );
    }

    registry.set(actualOutputPath, sourceName);
}

function getNoHashImageOutputPath(originalName, relativeDir) {
    const fileName = path.posix.basename(normalizePath(originalName));
    return relativeDir ? `assets/images/${relativeDir}/${fileName}` : `assets/images/${fileName}`;
}

export function createAssetOutputPathResolver({ rootDir, noHash }) {
    const noHashOutputs = new Map();

    return (assetInfo) => {
        const originalName = getAssetOriginalName(assetInfo);
        const extType = getExtension(originalName);

        if (extType === "css") {
            return noHash ? "assets/styles/main.min.css" : "assets/styles/main-[hash].min.css";
        }

        if (imageExtensions.has(extType)) {
            if (!noHash) {
                return "assets/images/[name]-[hash].[ext]";
            }

            const relativeDir = getImagesRelativeDir(originalName, rootDir);
            const outputPath = relativeDir
                ? `assets/images/${relativeDir}/[name].[ext]`
                : "assets/images/[name].[ext]";
            const actualOutputPath = getNoHashImageOutputPath(originalName, relativeDir);

            assertNoDuplicateNoHashOutput(actualOutputPath, originalName, noHashOutputs);
            return outputPath;
        }

        if (fontExtensions.has(extType)) {
            return noHash ? "assets/fonts/[name].[ext]" : "assets/fonts/[name]-[hash].[ext]";
        }

        return noHash ? "assets/[ext]/[name].[ext]" : "assets/[ext]/[name]-[hash].[ext]";
    };
}

function isBundleAsset(item) {
    return item?.type === "asset";
}

function isHtmlAsset(item) {
    return isBundleAsset(item) && item.fileName.endsWith(".html");
}

function toBuffer(source) {
    return Buffer.isBuffer(source) ? source : Buffer.from(source);
}

function replaceExtension(fileName, extension) {
    return fileName.replace(/\.[^.]+$/, extension);
}

function normalizePublicUrl(fileName) {
    return `/${normalizePath(fileName)}`;
}

function isExternalOrSpecialUrl(url) {
    return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

function isFaviconOrPwaIconUrl(pathname) {
    return pathname.startsWith("/img/favicons/") || pathname.startsWith("img/favicons/");
}

function getSourceImagePath(urlPathname, rootDir) {
    const normalized = urlPathname.replace(/^\/+/, "");

    if (!normalized.startsWith("src/assets/images/")) {
        return null;
    }

    return path.join(rootDir, normalized);
}

function getManualNoHashWebpFileName(sourcePath, rootDir) {
    const relativePath = normalizePath(
        path.relative(path.join(rootDir, "src/assets/images"), sourcePath)
    );
    return normalizePath(path.join("assets/images", replaceExtension(relativePath, ".webp")));
}

function getManualAssetName(sourcePath, rootDir) {
    return normalizePath(
        replaceExtension(
            path.relative(path.join(rootDir, "src/assets/images"), sourcePath),
            ".webp"
        )
    );
}

function getBundleWebpAssetName(item, rootDir) {
    const sourceName = item.originalFileNames?.[0] || item.name || item.fileName;
    const normalizedSourceName = normalizePath(sourceName);
    const srcImagesMarker = "src/assets/images/";
    const markerIndex = normalizedSourceName.indexOf(srcImagesMarker);

    if (markerIndex !== -1) {
        return replaceExtension(
            normalizedSourceName.slice(markerIndex + srcImagesMarker.length),
            ".webp"
        );
    }

    if (path.isAbsolute(sourceName)) {
        const relativePath = normalizePath(
            path.relative(path.join(rootDir, "src/assets/images"), sourceName)
        );

        if (!relativePath.startsWith("..")) {
            return replaceExtension(relativePath, ".webp");
        }
    }

    return path.posix.basename(replaceExtension(normalizedSourceName, ".webp"));
}

function parseSrcset(value) {
    return value.split(",").map((candidate) => {
        const trimmed = candidate.trim();
        const [url, ...descriptor] = trimmed.split(/\s+/);

        return {
            url,
            descriptor: descriptor.join(" ")
        };
    });
}

function stringifySrcset(candidates) {
    return candidates
        .map(({ url, descriptor }) => (descriptor ? `${url} ${descriptor}` : url))
        .join(", ");
}

async function createWebp(source, options) {
    return sharp(toBuffer(source)).webp(options).toBuffer();
}

export function webpAssetsPlugin({ rootDir, noHash, options = webpOptions } = {}) {
    const srcWebpByPath = new Map();

    return {
        name: "webp-assets",
        enforce: "post",
        apply: "build",
        async generateBundle(_outputOptions, bundle) {
            const webpByPublicUrl = new Map();

            for (const item of Object.values(bundle)) {
                if (!isBundleAsset(item)) {
                    continue;
                }

                const extType = getExtension(item.fileName);

                if (!rasterWebpSourceExtensions.has(extType)) {
                    continue;
                }

                const webpSource = await createWebp(item.source, options);
                const webpAssetName = getBundleWebpAssetName(item, rootDir);
                const emittedAsset = {
                    type: "asset",
                    name: webpAssetName,
                    source: webpSource
                };

                if (noHash) {
                    emittedAsset.fileName = replaceExtension(item.fileName, ".webp");
                }

                const referenceId = this.emitFile(emittedAsset);
                const webpFileName = this.getFileName(referenceId);

                webpByPublicUrl.set(
                    normalizePublicUrl(item.fileName),
                    normalizePublicUrl(webpFileName)
                );
                webpByPublicUrl.set(item.fileName, normalizePublicUrl(webpFileName));
            }

            const resolveWebpUrl = async (rawUrl) => {
                if (!rawUrl || isExternalOrSpecialUrl(rawUrl)) {
                    return rawUrl;
                }

                const { pathname, suffix } = stripQueryAndHash(rawUrl);
                const extType = getExtension(pathname);

                if (!rasterWebpSourceExtensions.has(extType) || isFaviconOrPwaIconUrl(pathname)) {
                    return rawUrl;
                }

                const directMatch =
                    webpByPublicUrl.get(pathname) ||
                    webpByPublicUrl.get(pathname.replace(/^\/+/, ""));

                if (directMatch) {
                    return `${directMatch}${suffix}`;
                }

                const sourcePath = getSourceImagePath(pathname, rootDir);

                if (!sourcePath) {
                    return rawUrl;
                }

                const cached = srcWebpByPath.get(sourcePath);

                if (cached) {
                    return `${normalizePublicUrl(cached)}${suffix}`;
                }

                const source = await fs.readFile(sourcePath);
                const webpSource = await createWebp(source, options);
                const emittedAsset = {
                    type: "asset",
                    name: getManualAssetName(sourcePath, rootDir),
                    source: webpSource
                };

                if (noHash) {
                    emittedAsset.fileName = getManualNoHashWebpFileName(sourcePath, rootDir);
                }

                const referenceId = this.emitFile(emittedAsset);
                const webpFileName = this.getFileName(referenceId);
                srcWebpByPath.set(sourcePath, webpFileName);

                return `${normalizePublicUrl(webpFileName)}${suffix}`;
            };

            for (const item of Object.values(bundle)) {
                if (!isHtmlAsset(item)) {
                    continue;
                }

                let html = item.source.toString();
                const attributePattern =
                    /\b(src|srcset|href|data-[a-zA-Z0-9_:-]+)\s*=\s*(["'])(.*?)\2/g;
                const replacements = [];
                let match;

                while ((match = attributePattern.exec(html)) !== null) {
                    const [, attributeName, quote, value] = match;
                    let nextValue = value;

                    if (attributeName === "srcset") {
                        const candidates = await Promise.all(
                            parseSrcset(value).map(async (candidate) => ({
                                ...candidate,
                                url: await resolveWebpUrl(candidate.url)
                            }))
                        );
                        nextValue = stringifySrcset(candidates);
                    } else {
                        nextValue = await resolveWebpUrl(value);
                    }

                    if (nextValue !== value) {
                        replacements.push({
                            start: match.index,
                            end: attributePattern.lastIndex,
                            value: `${attributeName}=${quote}${nextValue}${quote}`
                        });
                    }
                }

                for (const replacement of replacements.reverse()) {
                    html = `${html.slice(0, replacement.start)}${replacement.value}${html.slice(replacement.end)}`;
                }

                item.source = html;
            }
        }
    };
}
