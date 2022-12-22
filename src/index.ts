import fs from "fs";
import path from "path";

const VERSION_NUMBER = /^v?\d+$/;

async function main() {
    let targetVersion = process.argv[2];

    if (targetVersion === undefined) {
        console.error("Missing target version! Usage: npx @comet/upgrade <version>");
        process.exit(-1);
    }

    if (!VERSION_NUMBER.test(targetVersion)) {
        console.error("Can't parse version number. Example usage: npx @comet/upgrade v4");
        process.exit(-1);
    }

    if (!targetVersion.startsWith("v")) {
        targetVersion = `v${targetVersion}`;
    }

    const scriptsFolder = path.join(__dirname, targetVersion);

    if (!fs.existsSync(scriptsFolder)) {
        console.error(`Can't find target version '${targetVersion}'`);
        listTargetVersions();
        process.exit(-1);
    }

    await runUpgradeScripts(targetVersion);
}

async function runUpgradeScripts(targetVersion: string) {
    const scriptsFolder = path.join(__dirname, targetVersion);

    for (const fileName of fs.readdirSync(scriptsFolder)) {
        const upgradeScript = await import(path.join(scriptsFolder, fileName));

        try {
            await upgradeScript.default();
        } catch (error) {
            console.error(`Script '${targetVersion}/${fileName}' failed to execute. See original error below`);
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
