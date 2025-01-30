import fs from "fs";
import path from "path";
import semver, { SemVer } from "semver";

import { executeCommand } from "./util/execute-command.util";
import { getGitDiff } from "./util/get-git-diff.util";
import { getLatestPackageVersion } from "./util/get-latest-package-version";

const microservices = ["api", "admin", "site"] as const;

function microserviceExists(microservice: "api" | "admin" | "site") {
    return fs.existsSync(`${microservice}/package.json`);
}

const isLocalDevelopment = !process.argv[1].includes("/_npx");

async function main() {
    let targetVersionArg = process.argv[2];

    if (targetVersionArg === undefined) {
        console.error("Missing target version! Usage: npx @comet/upgrade <version>");
        process.exit(-1);
    }

    const isUpgradeScript = targetVersionArg.endsWith(".ts");

    if (isUpgradeScript) {
        if (fs.existsSync(path.join(__dirname, targetVersionArg.replace(/\.ts$/, ".js")))) {
            const module = await import(path.join(__dirname, targetVersionArg.replace(/\.ts$/, ".js")));
            await runUpgradeScript({
                name: targetVersionArg,
                stage: "before-install",
                // Need default.default because of ESM interoperability with CommonJS.
                // See https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext.
                script: module.default.default,
            });
            await runEslintFix();
        } else {
            console.error(`Can't find upgrade script '${targetVersionArg}'`);
            process.exit(-1);
        }
        return;
    }

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

    const currentVersion = getCurrentVersion();

    console.info(`Upgrading from v${currentVersion} to v${targetVersion}`);

    const upgradeScripts = await findUpgradeScripts(targetVersionFolder);

    const beforeInstallScripts = upgradeScripts.filter((script) => script.stage === "before-install");
    await runUpgradeScripts(beforeInstallScripts);

    console.info("Updating dependencies");
    await updateDependencies(targetVersion);

    const afterInstallScripts = upgradeScripts.filter((script) => script.stage === "after-install");
    await runUpgradeScripts(afterInstallScripts);

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
            ...(targetVersion.prerelease.length > 0 ? ["--save-exact"] : []),
            ...dependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
            ...devDependencies.map((dependency) => `${dependency}@${targetVersion.version}`),
        ]);
    }
}

type UpgradeScript = {
    name: string;
    stage: "before-install" | "after-install";
    script: () => Promise<void>;
};

async function findUpgradeScripts(targetVersionFolder: string): Promise<UpgradeScript[]> {
    const scripts: UpgradeScript[] = [];

    const scriptsFolder = path.join(__dirname, targetVersionFolder);

    for (const fileName of fs.readdirSync(scriptsFolder)) {
        const module = await import(path.join(__dirname, targetVersionFolder, fileName));

        scripts.push({
            name: fileName,
            stage: module.stage ?? "after-install",
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
        await script.script();
        if (isLocalDevelopment) {
            // run upgrade scripts twice locally to ensure that the scripts are idempotent
            const diffBefore = getGitDiff();
            await script.script();
            const diffAfter = getGitDiff();

            if (diffBefore !== diffAfter) {
                console.error(`❌ ${script.name}: Changes detected when executing script twice`);
                process.exit(-1);
            }
        }
    } catch (error) {
        console.error(`Script '${script.name}' failed to execute. See original error below`);
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
