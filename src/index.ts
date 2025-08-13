import chalk from "chalk";
import fs from "fs";
import { globSync } from "glob";
import * as util from "node:util";
import path from "path";
import semver, { SemVer } from "semver";

import { executeCommand } from "./util/execute-command.util";
import { getLatestPackageVersion } from "./util/get-latest-package-version";

const microservices = ["api", "admin", "site"] as const;

function microserviceExists(microservice: "api" | "admin" | "site") {
    return fs.existsSync(`${microservice}/package.json`);
}

const isLocalDevelopment = !process.argv[1].includes("_npx");
const skipLint = process.argv.includes("--skip-lint");

async function main() {
    const targetVersionArg = process.argv[2];

    if (targetVersionArg === undefined) {
        console.error("Missing target version! Usage: npx @comet/upgrade <version>");
        process.exit(-1);
    }

    if (isLocalDevelopment) {
        console.warn("Executed via node -> assuming local development. Scripts will run twice to ensure idempotency.");
    }

    const isUpgradeScript = targetVersionArg.endsWith(".ts");
    const isSubfolder = targetVersionArg.includes("/");

    if (isUpgradeScript) {
        if (fs.existsSync(path.join(__dirname, targetVersionArg.replace(/\.ts$/, ".js")))) {
            const module = await import(path.join(__dirname, targetVersionArg.replace(/\.ts$/, ".js")));
            await runUpgradeScript({
                name: targetVersionArg,
                stage: "before-install",
                script: module.default.default,
            });
            if (!skipLint) await runEslintFix();
        } else {
            console.error(`Can't find upgrade script '${targetVersionArg}'`);
            process.exit(-1);
        }
        return;
    } else if (isSubfolder) {
        await executeSubfolder(targetVersionArg);
    } else {
        await executeAll(targetVersionArg);
    }
}

async function executeSubfolder(targetVersionArg: string) {
    const upgradeScripts = await findUpgradeScripts(targetVersionArg);
    console.info("\n⚙️ Executing scripts\n");
    await runUpgradeScripts(upgradeScripts);
    console.info("\n✅️ Scripts finished\n");
    if (!skipLint) await runEslintFix();
}

async function executeAll(targetVersionArg: string) {
    if (!targetVersionArg.includes(".")) {
        targetVersionArg = await getLatestPackageVersion("@comet/admin", semver.coerce(targetVersionArg)?.major);
    }
    const targetVersion = semver.coerce(targetVersionArg, { includePrerelease: true });

    if (!targetVersion) {
        console.error("Can't parse version number. Example usage: npx @comet/upgrade v4");
        process.exit(-1);
    }

    const targetVersionFolder = `v${targetVersion.major}`;

    const scriptsFolder = path.join(__dirname, targetVersionFolder);

    if (!fs.existsSync(scriptsFolder)) {
        console.error(`Can't find upgrade scripts for target version '${targetVersionFolder}'`);
        listTargetVersions();
        process.exit(-1);
    }

    const currentMajorVersion = getCurrentVersion();
    console.info(`Upgrading from v${currentMajorVersion} to v${targetVersion}`);

    const upgradeScripts = await findUpgradeScripts(targetVersionFolder);

    console.info("\n⚙️ Executing before install scripts\n");
    const beforeInstallScripts = upgradeScripts.filter((script) => script.stage === "before-install");
    await runUpgradeScripts(beforeInstallScripts);
    console.info("\n☑️ Before install scripts finished\n");

    console.info("\n🔄 Updating dependencies\n");
    await updateDependencies(targetVersion, currentMajorVersion !== targetVersion.major);
    console.info("\n☑️ Dependency update finished\n");

    console.info("\n🚀 Executing after install scripts\n");
    const afterInstallScripts = upgradeScripts.filter((script) => script.stage === "after-install");
    await runUpgradeScripts(afterInstallScripts);
    console.info("\n☑️ After install scripts finished\n");

    if (!skipLint) await runEslintFix();
}

interface PackageJson {
    dependencies?: Record<string, string | undefined>;
    devDependencies?: Record<string, string | undefined>;
}

function getCurrentVersion() {
    if (!microserviceExists("admin")) {
        console.error(`File 'admin/package.json' doesn't exist. Make sure to call the script in the root of your project`);
        process.exit(-1);
    }

    const packageJson = JSON.parse(fs.readFileSync("admin/package.json").toString()) as PackageJson;

    const versionRange = packageJson.dependencies?.["@comet/admin"];

    if (versionRange === undefined) {
        console.error(`Package '@comet/admin' isn't listed as a dependency. Is this a Comet DXP project?`);
        process.exit(-1);
    }

    // ^3.0.0 | ~3.0.0 | 3.0.0-canary -> 3.0.0
    const versionMatches = versionRange.match(/\d+\.\d+\.\d+/);

    if (versionMatches === null) {
        console.error(`Unsupported version range '${versionRange}'. Example range: ^3.0.0`);
        process.exit(-1);
    }

    const version = versionMatches[0];

    return semver.major(version);
}

async function updateDependencies(targetVersion: SemVer, isMajorUpdate = false) {
    await executeCommand("npm", ["install", "--no-audit", "--loglevel", "error", "--save-exact", `@comet/cli@${targetVersion.version}`]);

    const packages: Record<(typeof microservices)[number], string[]> = {
        api: ["@comet/blocks-api", "@comet/cms-api"],
        admin: [
            "@comet/admin",
            "@comet/admin-color-picker",
            "@comet/admin-date-time",
            "@comet/admin-icons",
            "@comet/admin-react-select",
            "@comet/admin-rte",
            "@comet/admin-theme",
            "@comet/blocks-admin",
            "@comet/cms-admin",
        ],
        site: ["@comet/cms-site"],
    };

    for (const microservice of microservices) {
        if (!microserviceExists(microservice)) {
            console.warn(`File '${microservice}/package.json' doesn't exist. Skipping microservice`);
            continue;
        }

        const packageJson = JSON.parse(fs.readFileSync(`${microservice}/package.json`).toString()) as PackageJson;

        const dependencies = packages[microservice].filter((packageName) => packageJson.dependencies?.[packageName] !== undefined);

        const devDependencies = [
            "@comet/cli",
            "@comet/eslint-config",
            "@comet/eslint-plugin",
            "@comet/admin-generator",
            "@comet/api-generator",
        ].filter((packageName) => packageJson.devDependencies?.[packageName] !== undefined);

        if (dependencies.length === 0 && devDependencies.length === 0) {
            console.warn(`Microservice '${microservice}' has no Comet DXP dependencies. Skipping install`);
            continue;
        }

        if (isMajorUpdate) {
            if (fs.existsSync(`${microservice}/node_modules`)) {
                fs.rmSync(`${microservice}/node_modules`, { recursive: true, force: true });
            }
            if (fs.existsSync(`${microservice}/package-lock.json`)) {
                fs.rmSync(`${microservice}/package-lock.json`);
            }
        }

        await executeCommand("npm", [
            "install",
            "--prefix",
            microservice,
            "--no-audit",
            "--loglevel",
            "error",
            "--save-exact",
            ...dependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
            ...devDependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
        ]);
    }
}

type UpgradeScript = {
    name: string;
    stage: Stage;
    script: () => Promise<void>;
};

type Stage = "before-install" | "after-install" | "never";

async function findUpgradeScripts(targetVersionFolder: string): Promise<UpgradeScript[]> {
    const scripts: UpgradeScript[] = [];

    const scriptsFolder = path.join(__dirname, targetVersionFolder);

    const files = globSync("**/*.js", { cwd: scriptsFolder, nodir: true });

    for (const relativePath of files) {
        const module = await import(path.join(scriptsFolder, relativePath));
        const folders = relativePath.split("/");
        const stage: Stage | undefined = folders.length >= 3 ? folders[1] : module.stage;

        scripts.push({
            name: relativePath,
            stage: stage ?? "after-install",
            // Need default.default because of ESM interoperability with CommonJS.
            // See https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext.
            script: module.default.default,
        });
    }

    return scripts;
}

async function runUpgradeScripts(scripts: UpgradeScript[]) {
    for (const script of scripts) {
        await runUpgradeScript(script);
    }
}

async function runUpgradeScript(script: UpgradeScript) {
    try {
        console.info(`📜 Running script '${script.name}'`);
        await script.script();
        if (isLocalDevelopment) {
            // run upgrade scripts twice locally to ensure that the scripts are idempotent
            await script.script();
        }
    } catch (error) {
        console.error(`Script '${script.name}' failed to execute. See original error below`);
        console.error(error);
    }
}

async function runEslintFix() {
    console.info("Trying to fix ESLint errors");

    for (const microservice of microservices) {
        if (!microserviceExists(microservice)) {
            continue;
        }

        try {
            await executeCommand("npm", ["run", "--prefix", microservice, "--no-audit", "--loglevel", "error", "lint:eslint", "--", "--fix"], {
                silent: true,
            });
        } catch (err) {
            console.error(`Failed to fix ESLint errors in ${microservice}. You must fix the linting errors yourself.`);
        }
    }
}

function listTargetVersions() {
    console.info("Available target versions");
    const targetVersions = fs.readdirSync(__dirname).filter((entry) => entry.startsWith("v"));
    console.info(targetVersions.map((version) => `- ${version}`).join("\n"));
}

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
    const formattedArgs = args.map((arg) => (typeof arg === "object" ? util.inspect(arg, { depth: null, colors: true }) : chalk.red(arg)));
    originalError(...formattedArgs);
};

console.warn = (...args) => {
    const formattedArgs = args.map((arg) => (typeof arg === "object" ? util.inspect(arg, { depth: null, colors: true }) : chalk.yellow(arg)));
    originalWarn(...formattedArgs);
};

main();
