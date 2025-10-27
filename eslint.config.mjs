import { defineConfig } from "eslint/config";
import * as mdxParser from "eslint-mdx";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("next/core-web-vitals", "next/typescript"),

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
    },
}, {
    files: [".lintstagedrc.js"],

    rules: {
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: ["**/*.mdx"],
    extends: compat.extends("plugin:mdx/recommended"),

    languageOptions: {
        parser: mdxParser,
    },
}, {
    files: ["**/*.mdx"],

    rules: {
        "react/no-unescaped-entities": "off",
    },
}]);