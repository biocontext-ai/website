import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import nextPlugin from "eslint-config-next"
import reactCompiler from "eslint-plugin-react-compiler"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const config = [
  ...nextPlugin,
  // MDX: apply recommended MDX linting and parser for .mdx files
  ...compat.config({
    overrides: [
      {
        files: ["**/*.mdx"],
        extends: ["plugin:mdx/recommended"],
        parser: "eslint-mdx",
      },
    ],
  }),
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  // MDX-specific rule adjustments
  {
    files: ["**/*.mdx"],
    rules: {
      // Allow quotes, dashes, etc. in prose inside MDX
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: [".lintstagedrc.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]

export default config
