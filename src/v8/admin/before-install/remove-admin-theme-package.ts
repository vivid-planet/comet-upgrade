import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function removeAdminThemePackage() {
    if (existsSync("admin/package.json")) {
        const packageJson = new PackageJson("admin/package.json");
        const themeVersion = packageJson.getDependencyVersion("@comet/admin-theme"); // for beta versions
        packageJson.removeDependency("@comet/admin-theme");

        if (!packageJson.hasDependency("@comet/admin")) {
            packageJson.addDependency("@comet/admin", themeVersion ?? "^8.0.0");
        }

        packageJson.save();
    }
}
