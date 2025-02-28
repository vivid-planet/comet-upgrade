import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

/**
 * Fixes the rimraf command in the generator scripts in the package.json files.
 *
 * adding a `-g` glob pattern to the rimraf command and updating the glob pattern to match the generated folders
 * will delete the generated folders again.
 */
export default async function fixRimRafGeneratorScripts() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const adminPackageJson = new PackageJson("admin/package.json");

    adminPackageJson.addScript("admin-generator", "rimraf -g 'src/**/generated' && comet-admin-generator generate");

    adminPackageJson.save();

    if (!existsSync("admin/package.json")) {
        return;
    }

    const apiPackageJson = new PackageJson("api/package.json");

    apiPackageJson.addScript("api-generator", "rimraf 'src/*/generated' && comet-api-generator generate");

    apiPackageJson.save();
}
