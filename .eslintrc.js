module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "testing-library"],
  extends: ["next", "next/core-web-vitals", "prettier"],
  rules: {
    "@typescript-eslint/consistent-type-imports": "error",
    "react/display-name": "off",
    "testing-library/no-node-access": "off"
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
      extends: ["plugin:testing-library/react"],
      env: {
        jest: true
      }
    }
  ]
};
