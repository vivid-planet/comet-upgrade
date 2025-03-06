import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

const adminPackageJsonPath = "admin/package.json";

export default async function updateMuiXDependencies() {
    if (!existsSync(adminPackageJsonPath)) {
        return;
    }

    const packageJson = new PackageJson(adminPackageJsonPath);

    packageJson.addDependency("@mui/x-data-grid", "^7.0.0");
    packageJson.addDependency("@mui/x-data-grid-pro", "^7.0.0");

    packageJson.save();
}
