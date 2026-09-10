// ESLint 9 usa "flat config"; o eslint-config-next 16 já exporta nesse formato.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-*/**",
      "dist/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Regras novas do preset do Next 16 (React Compiler). Elas apontam
      // padrões que já existiam no projeto antes do upgrade — ficam como aviso
      // para não travar o lint, e devem ser tratadas componente a componente.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
];
