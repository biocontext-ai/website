const path = require("path")

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => path.relative(process.cwd(), f)).join(" ")}`

module.exports = {
  "*.{js,jsx,mdx}": ["prettier --write", buildEslintCommand],
  "*.{ts,tsx}": ["prettier --write", buildEslintCommand],
}
