import { existsSync, readFileSync, rmSync } from "node:fs";

import { Project, type SourceFile, SyntaxKind } from "ts-morph";

import { PackageJson } from "../util/package-json.util.js";

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

        // remove .eslintrc.cli.js
        if (existsSync("site/.eslintrc.cli.js")) {
            rmSync("site/.eslintrc.cli.js");
            const packageJson = new PackageJson("site/package.json");
            packageJson.removeScript("lint:eslint");
            packageJson.addScript("lint:eslint", "eslint --max-warnings 0 src/ **/*.json --no-warn-ignored");
            packageJson.save();
        }
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

    const project = new Project({ tsConfigFilePath: `./${workingDirectory}tsconfig.json` });
    const filePath = `${workingDirectory}eslint.config.mjs`;
    const sourceFile = project.createSourceFile(filePath, oldEslintConfigTodo + fileContent, { overwrite: true });

    transferEslintIgnore({ workingDirectory, sourceFile });

    sourceFile.saveSync();
};

const deleteOldEslintRc = ({ workingDirectory }: { workingDirectory: string }) => {
    console.log(`🚀 Delete old .eslintrc.json configuration file ${workingDirectory}`);
    rmSync(`${workingDirectory}.eslintrc.json`);
};

const transferEslintIgnore = ({ workingDirectory, sourceFile }: { workingDirectory: string; sourceFile: SourceFile }) => {
    console.log(`🚀 Transfer ignores from .eslintignore to eslint.config.mjs ${workingDirectory}`);
    if (!existsSync(`${workingDirectory}.eslintignore`)) {
        return;
    }

    const eslintIgnore = readFileSync(`${workingDirectory}.eslintignore`, "utf-8")
        .split("\n")
        .filter((ignore) => ignore.length > 0);

    const arrayLiteral = sourceFile.getVariableStatementOrThrow("config").getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression)[0];

    const firstObject = arrayLiteral.getElements()[0];

    if (firstObject.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const ignoresProp = firstObject.getProperty("ignores");

        if (ignoresProp?.isKind(SyntaxKind.PropertyAssignment)) {
            const ignoresArray = ignoresProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);

            if (ignoresArray) {
                eslintIgnore.forEach((ignore) => {
                    if (!ignoresArray?.getElements().some((element) => element.getText() === `"${ignore}"`)) {
                        ignoresArray?.addElement(`"${ignore}"`);
                    }
                });
            }
        }
    }

    console.log(`🚀 Delete old .eslintignore file ${workingDirectory}`);
    rmSync(`${workingDirectory}.eslintignore`);
};
