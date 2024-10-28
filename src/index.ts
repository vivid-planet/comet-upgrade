import fs from "fs";
import path from "path";
import semver, { SemVer } from "semver";

import { executeCommand } from "./util/execute-command.util";

const microservices = ["api", "admin", "site"] as const;

function microserviceExists(microservice: "api" | "admin" | "site") {
    return fs.existsSync(`${microservice}/package.json`);
}

async function main() {
    const targetVersionArg = process.argv[2];

    if (targetVersionArg === undefined) {
        console.error("Missing target version! Usage: npx @comet/upgrade <version>");
        process.exit(-1);
    }

    const isUpgradeScript = targetVersionArg.endsWith(".ts");

    if (isUpgradeScript) {
        if (fs.existsSync(path.join(__dirname, targetVersionArg.replace(/\.ts$/, ".js")))) {
            await runUpgradeScript(targetVersionArg.replace(/\.ts$/, ".js"));
            await runEslintFix();
        } else {
            console.error(`Can't find upgrade script '${targetVersionArg}'`);
            process.exit(-1);
        }
        return;
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

    const currentVersion = getCurrentVersion();

    console.info(`Upgrading from v${currentVersion} to v${targetVersion}`);

    console.info("Updating dependencies");
    await updateDependencies(targetVersion);

    await runUpgradeScripts(targetVersionFolder);

    await runEslintFix();
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

async function updateDependencies(targetVersion: SemVer) {
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

        const devDependencies = ["@comet/cli", "@comet/eslint-config", "@comet/eslint-plugin"].filter(
            (packageName) => packageJson.devDependencies?.[packageName] !== undefined,
        );

        if (dependencies.length === 0 && devDependencies.length === 0) {
            console.warn(`Microservice '${microservice}' has no Comet DXP dependencies. Skipping install`);
            continue;
        }

        await executeCommand("npm", [
            "install",
            "--prefix",
            microservice,
            "--no-audit",
            "--loglevel",
            "error",
            targetVersion.prerelease.length > 0 ? "--save-exact" : "",
            ...dependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
            ...devDependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
        ]);
    }
}

async function runUpgradeScripts(targetVersionFolder: string) {
    const scriptsFolder = path.join(__dirname, targetVersionFolder);

    for (const fileName of fs.readdirSync(scriptsFolder)) {
        await runUpgradeScript(path.join(targetVersionFolder, fileName));
    }
}

async function runUpgradeScript(script: string) {
    const upgradeScript = await import(path.join(__dirname, script));

    try {
        await upgradeScript.default();
    } catch (error) {
        console.error(`Script '${script}' failed to execute. See original error below`);
        console.error(error);
    }
}

async function runEslintFix() {
    console.info("Fixing ESLint errors");

    for (const microservice of microservices) {
        if (!microserviceExists(microservice)) {
            continue;
        }

        try {
            await executeCommand("npm", ["run", "--prefix", microservice, "--no-audit", "--loglevel", "error", "lint:eslint", "--", "--fix"]);
        } catch (err) {
            console.error(`Failed to fix ESLint errors in ${microservice}. See original error below`);
            console.error(err);
        }
    }
}

function listTargetVersions() {
    console.info("Available target versions");
    const targetVersions = fs.readdirSync(__dirname).filter((entry) => entry.startsWith("v"));
    console.info(targetVersions.map((version) => `- ${version}`).join("\n"));
}

main();
