import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      ".server-out/**",
      "next-env.d.ts",
      "apps/**",
      "supabase/functions/**",
      "node_modules/**",
    ],
  },
];

export default eslintConfig;
