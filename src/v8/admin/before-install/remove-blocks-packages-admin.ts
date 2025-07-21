import { existsSync } from "fs";

import { PackageJson } from "../../../util/package-json.util";

export const stage = "before-install";

export default async function removeBlocksPackagesAdmin() {
    if (existsSync("admin/package.json")) {
        const packageJson = new PackageJson("admin/package.json");
        packageJson.removeDependency("@comet/blocks-admin");
        packageJson.save();
    }
}
