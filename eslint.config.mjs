import eslintConfigCore from "@comet/eslint-config/core.js";
import { globalIgnores } from "eslint/config";

/** @type {import('eslint')} */
const config = [
    ...eslintConfigCore,
    {
        rules: {
            "no-console": "off",
            "@comet/no-other-module-relative-import": "off", // tsc doesn't support the "@src" import alias
        },
    },
    globalIgnores(["package-lock.json"]),
];

export default config;
