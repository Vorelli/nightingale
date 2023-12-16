module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ["standard-with-typescript", "plugin:react/recommended"],
  overrides: [
    {
      env: {
        node: true
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script"
      }
    }
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./src/client/tsconfig.json"]
  },
  plugins: ["react", "@stylistic/js"],
  rules: {
    "@typescript-eslint/naming-convention": "off",
    "@stylistic/js/quotes": [2, "double"],
    "@stylistic/js/semi": ["error", "always"]
  }
};
