import { PackageJson } from "../util/package-json.util";
import { existsSync } from "fs";

export const stage = "before-install";

/**
 * Updates prettier to v3
 */
export default async function updatePrettier() {
    if (existsSync("package.json")) {
        console.log("🚀 Update prettier to v3.4.2 in root");
        const packageJson = new PackageJson("package.json");
        packageJson.updateDependency("prettier", "^3.4.2");
        packageJson.save();
    }

    if (existsSync("admin/package.json")) {
        console.log("🚀 Update prettier to v3.4.2 in admin");
        const packageJson = new PackageJson("admin/package.json");
        packageJson.updateDependency("prettier", "^3.4.2");
        packageJson.save();
    }

    if (existsSync("api/package.json")) {
        console.log("🚀 Update prettier to v3.4.2 in api");
        const packageJson = new PackageJson("api/package.json");
        packageJson.updateDependency("prettier", "^3.4.2");
        packageJson.save();
    }
    if (existsSync("site/package.json")) {
        console.log("🚀 Update prettier to v3.4.2 in site");
        const packageJson = new PackageJson("site/package.json");
        packageJson.updateDependency("prettier", "^3.4.2");
        packageJson.save();
    }
}
