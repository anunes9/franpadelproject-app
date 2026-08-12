import nextConfig from "eslint-config-next"

const eslintConfig = [
  {
    ignores: ["design/**", "scripts/**"],
  },
  ...nextConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]

export default eslintConfig
