import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function removeBlocksPackagesApi() {
    if (existsSync("api/package.json")) {
        const packageJson = new PackageJson("api/package.json");
        packageJson.removeDependency("@comet/blocks-api");
        packageJson.save();
    }
}
