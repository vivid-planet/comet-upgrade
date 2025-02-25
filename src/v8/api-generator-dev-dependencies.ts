import { existsSync } from "fs";

import { executeCommand } from "../util/execute-command.util";
import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Add @comet/api-generator package to dev dependencies of api
 */
export default async function updatePrettier() {
    if (existsSync("api/package.json")) {
        const result = await executeCommand("npm", ["view", "@comet/admin@8", "version", "--json"]);
        const versions = JSON.parse(result) as string[];
        const version = versions[versions.length - 1];
        console.log(`🚀 api/package.json add @comet/api-generator package with version ${version} to dev-dependencies`);
        const packageJson = new PackageJson("api/package.json");
        packageJson.addDependency("@comet/api-generator", versions[versions.length - 1], true);
        packageJson.save();
    }
}
