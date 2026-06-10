import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "dist");

const groups = [
    { name: "html", pattern: /\.(html)$/i },
    { name: "css", pattern: /\.(css)$/i },
    { name: "js", pattern: /\.(mjs|cjs|js)$/i },
    { name: "images", pattern: /\.(avif|gif|ico|jpeg|jpg|png|svg|webp)$/i },
    { name: "fonts", pattern: /\.(eot|otf|ttf|woff|woff2)$/i }
];

function formatSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getGroupName(filePath) {
    const entry = groups.find(({ pattern }) => pattern.test(filePath));

    return entry?.name ?? "other";
}

async function readDistStats() {
    const files = await fg("**/*", {
        cwd: distDir,
        onlyFiles: true
    });

    const stats = new Map();
    let totalBytes = 0;

    for (const file of files) {
        const filePath = path.join(distDir, file);
        const fileStat = await fs.stat(filePath);
        const groupName = getGroupName(file);
        const current = stats.get(groupName) ?? { files: 0, bytes: 0 };

        current.files += 1;
        current.bytes += fileStat.size;
        totalBytes += fileStat.size;
        stats.set(groupName, current);
    }

    return {
        files: files.length,
        totalBytes,
        stats
    };
}

try {
    await fs.access(distDir);
} catch {
    console.error('[report] "dist" not found. Run a build before requesting the report.');
    process.exit(1);
}

const report = await readDistStats();
const rows = [...report.stats.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .map(([name, value]) => ({
        type: name,
        files: value.files,
        size: formatSize(value.bytes)
    }));

console.log("");
console.log("[report] Build output");
console.table(rows);
console.log(
    `[report] Total: ${report.files} files, ${formatSize(report.totalBytes)} in ${path.relative(
        rootDir,
        distDir
    )}`
);
