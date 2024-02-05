import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import semver from "semver";

const VERSION_NUMBER = /^v?\d+$/;
const microservices = ["api", "admin", "site"] as const;

function microserviceExists(microservice: "api" | "admin" | "site") {
    return fs.existsSync(`${microservice}/package.json`);
}

async function main() {
    let targetVersionArg = process.argv[2];

    if (targetVersionArg === undefined) {
        console.error("Missing target version! Usage: npx @comet/upgrade <version>");
        process.exit(-1);
    }

    if (!VERSION_NUMBER.test(targetVersionArg)) {
        console.error("Can't parse version number. Example usage: npx @comet/upgrade v4");
        process.exit(-1);
    }

    if (targetVersionArg.startsWith("v")) {
        targetVersionArg = targetVersionArg.substring(1);
    }

    const targetVersion = Number(targetVersionArg);

    const scriptsFolder = path.join(__dirname, `v${targetVersion}`);

    if (!fs.existsSync(scriptsFolder)) {
        console.error(`Can't find target version 'v${targetVersionArg}'`);
        listTargetVersions();
        process.exit(-1);
    }

    const currentVersion = getCurrentVersion();

    console.info(`Upgrading from v${currentVersion} to v${targetVersion}`);

    console.info("Updating dependencies");
    await updateDependencies(targetVersion);

    await runUpgradeScripts(targetVersion);

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
    const versionMatches = versionRange.match(/\d\.\d\.\d/);

    if (versionMatches === null) {
        console.error(`Unsupported version range '${versionRange}'. Example range: ^3.0.0`);
        process.exit(-1);
    }

    const version = versionMatches[0];

    return semver.major(version);
}

async function updateDependencies(targetVersion: number) {
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

        const devDependencies = ["@comet/cli", "@comet/eslint-config"].filter(
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
            ...dependencies.map((dependency) => `${dependency}@${targetVersion}`),
            ...devDependencies.map((dependency) => `${dependency}@${targetVersion}`),
        ]);
    }
}

// Inspired by https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/createReactApp.js#L383
function executeCommand(command: string, args: string[] = []) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit" });

        child.on("close", (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(" ")}`,
                });
                return;
            }
            resolve();
        });
    });
}

async function runUpgradeScripts(targetVersion: number) {
    const scriptsFolder = path.join(__dirname, `v${targetVersion}`);

    for (const fileName of fs.readdirSync(scriptsFolder)) {
        const upgradeScript = await import(path.join(scriptsFolder, fileName));

        try {
            await upgradeScript.default();
        } catch (error) {
            console.error(`Script 'v${targetVersion}/${fileName}' failed to execute. See original error below`);
            console.error(error);
        }
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
        } catch (e) {
            console.error(`Error trying to run 'lint:eslint' in ${microservice}`);
        }
    }
}

function listTargetVersions() {
    console.info("Available target versions");
    const targetVersions = fs.readdirSync(__dirname).filter((entry) => entry.startsWith("v"));
    console.info(targetVersions.map((version) => `- ${version}`).join("\n"));
}

main();
