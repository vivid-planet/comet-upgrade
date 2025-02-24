import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Add @comet/api-generator package to dev dependencies of api
 */
export default async function updatePrettier() {
    if (existsSync("api/package.json")) {
        console.log("🚀 api/package.json add @comet/api-generator-package to dev-dependencies");
        const packageJson = new PackageJson("api/package.json");
        packageJson.addDependency("@comet/api-generator", "^8.0.0", true);
        packageJson.save();
    }
}
