import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";

import { PackageJson } from "../util/package-json.util";

const adminEslintConfig = `import eslintConfigReact from "@comet/eslint-config/react.js";

/** @type {import('eslint')} */
const config = [
    {
        ignores: ["schema.json", "src/fragmentTypes.json", "dist/**", "src/**/*.generated.ts"],
    },
    ...eslintConfigReact,
];

export default config;`;
const apiEslintConfig = `import eslintConfigNestJs from "@comet/eslint-config/nestjs.js";

/** @type {import('eslint')} */
const config = [
    {
        ignores: ["src/db/migrations/**", "dist/**", "src/**/*.generated.ts"],
    },
    ...eslintConfigNestJs,
];

export default config;`;
const siteEslintConfig = `import eslintConfigNextJs from "@comet/eslint-config/nextjs.js";

/** @type {import('eslint')} */
const config = [
    {
        ignores: ["**/**/*.generated.ts", "dist/**", "lang/**", "lang-compiled/**", "lang-extracted/**", ".next/**", "public/**"],
    },
    ...eslintConfigNextJs,
];

export default config;`;

export const stage = "before-install";

/**
 * This Updates script is doing following:
 *
 * - updates eslint to version 9.
 * - creates new eslint.config.mjs file with default configuration
 * - copies content from .eslint.json to new eslint.config.mjs as a comment
 * - deletes old .eslint.json file
 */
export default async function updateEslint() {
    if (existsSync("admin/package.json")) {
        updateDevDependenciesInPackageJsons({ packageJsonPath: "admin/package.json" });
        createNewFlatConfigurationFile({
            workingDirectory: "admin/",
            fileContent: adminEslintConfig,
        });
        deleteOldEslintRc({ workingDirectory: "admin/" });
    }

    if (existsSync("api/package.json")) {
        updateDevDependenciesInPackageJsons({ packageJsonPath: "api/package.json" });
        createNewFlatConfigurationFile({
            workingDirectory: "api/",
            fileContent: apiEslintConfig,
        });
        deleteOldEslintRc({ workingDirectory: "api/" });
    }
    if (existsSync("site/package.json")) {
        updateDevDependenciesInPackageJsons({ packageJsonPath: "site/package.json" });
        createNewFlatConfigurationFile({
            workingDirectory: "site/",
            fileContent: siteEslintConfig,
        });
        deleteOldEslintRc({ workingDirectory: "site/" });
    }
}

const updateDevDependenciesInPackageJsons = ({ packageJsonPath }: { packageJsonPath: string }) => {
    console.log(`🚀 Update eslint to v9.18.0 in ${packageJsonPath}`);
    const packageJson = new PackageJson(packageJsonPath);
    packageJson.updateDependency("eslint", "^9.18.0");
    packageJson.save();
};

const createNewFlatConfigurationFile = ({ workingDirectory, fileContent }: { workingDirectory: string; fileContent: string }) => {
    console.log(`🚀 Create new eslint.config.mjs flat configuration .file ${workingDirectory}`);
    const eslintConfig = readFileSync(`${workingDirectory}.eslintrc.json`, "utf-8");
    const commentedEslintConfig = eslintConfig
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n");

    const oldEslintConfigTodo = `// TODO: integrate custom rules from project into new eslint.config.mjs file
 // 
 // Content from .eslintrc.json:
 //
 ${commentedEslintConfig}
 `;
    writeFileSync(`${workingDirectory}eslint.config.mjs`, oldEslintConfigTodo + fileContent);
};

const deleteOldEslintRc = ({ workingDirectory }: { workingDirectory: string }) => {
    console.log(`🚀 Delete old .eslintrc.json configuration file ${workingDirectory}`);
    rmSync(`${workingDirectory}.eslintrc.json`);
};
