import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  // Ignore generated / deps folders
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "wrong/**"],
  },

  // Base JS recommendations
  js.configs.recommended,

  // TypeScript + TSX recommendations
  ...tseslint.configs.recommended,

  // Global naming conventions (camelCase)
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    rules: {
      camelcase: [
        "error",
        {
          properties: "never", // allow snake_case from APIs
          ignoreDestructuring: true, // allow destructuring snake_case
        },
      ],
    },
  },

  // React rules (for .tsx/.jsx only)
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // With React 17+, no need to import React just for JSX
      "react/react-in-jsx-scope": "off",
    },
  },

  // Disable formatting-related ESLint rules that conflict with Prettier
  prettier,
];
