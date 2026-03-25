import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("project scaffold", () => {
    test("keeps the expected entry files", () => {
        expect(existsSync(resolve("src/views/index.html"))).toBe(true);
        expect(existsSync(resolve("src/views/404.html"))).toBe(true);
        expect(existsSync(resolve("src/views/pages/page.html"))).toBe(true);
        expect(existsSync(resolve("src/blocks/modules/hero/hero.html"))).toBe(true);
        expect(existsSync(resolve("src/js/main.js"))).toBe(true);
        expect(existsSync(resolve("src/styles/main.scss"))).toBe(true);
    });
});
