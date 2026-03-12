import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
    {
        ignores: ["dist/**", "node_modules/**", "public/**"]
    },
    js.configs.recommended,
    prettier,
    {
        files: ["**/*.{js,mjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            "no-console": "off"
        }
    }
];
