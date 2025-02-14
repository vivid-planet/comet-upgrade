import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

/**
 * api-generator is integrated into the CLI package and has a new command `comet api-generator`
 */
export default async function apiGeneratorInCliPackage() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");
    packageJson.addScript("api-generator", "rimraf 'src/*/generated' && comet api-generator");
    packageJson.addScript("api-generator:watch", "rimraf 'src/*/generated' && comet api-generator --watch");
    packageJson.save();
}
