import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";
import hooks from "eslint-plugin-react-hooks";
export default [
 { ignores: [".next*/**", "node_modules/**", "next-env.d.ts"] },
 ...tseslint.configs.recommended,
 { files: ["**/*.{ts,tsx}"], plugins: { "@next/next": next, "react-hooks": hooks }, rules: {
   ...next.configs.recommended.rules, ...next.configs["core-web-vitals"].rules, ...hooks.configs.recommended.rules,
   "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
 } }
];
