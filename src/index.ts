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
    if (!fs.existsSync("admin/node_modules/@comet/admin/package.json")) {
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync("admin/node_modules/@comet/admin/package.json").toString());

    if (!packageJson.version || !semver.valid(packageJson.version)) {
        return;
    }

    return semver.major(packageJson.version);
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
