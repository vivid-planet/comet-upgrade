import fs from "fs";
import path from "path";
import semver from "semver";

const VERSION_NUMBER = /^v?\d+$/;

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
    await runUpgradeScripts(targetVersion);
}

function getCurrentVersion() {
    if (!fs.existsSync("admin/package.json")) {
        console.error(`File 'admin/package.json' doesn't exist. Make sure to call the script in the root of your project`);
        process.exit(-1);
    }

    interface PackageJson {
        dependencies?: Record<string, string | undefined>;
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

function listTargetVersions() {
    console.info("Available target versions");
    const targetVersions = fs.readdirSync(__dirname).filter((entry) => entry.startsWith("v"));
    console.info(targetVersions.map((version) => `- ${version}`).join("\n"));
}

main();
