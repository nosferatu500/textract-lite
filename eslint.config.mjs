import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/**", "docs/**"],
    },
    js.configs.recommended,
    {
        files: ["**/*.ts"],
        extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
        languageOptions: {
            parserOptions: {
                // The project service replaces an explicit `project` glob: it
                // asks TypeScript which config owns each file.
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // tests/ is deliberately outside tsconfig.json -- Node runs it straight
        // from source and it is never compiled -- so the project service has no
        // types for it. Lint it with the syntactic rules only. Type-aware rules
        // here would additionally need @types/mocha and chai's types.
        files: ["tests/**/*.ts"],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: false,
            },
        },
    },
);
