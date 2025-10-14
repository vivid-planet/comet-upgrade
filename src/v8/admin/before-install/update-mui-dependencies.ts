import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

const adminPackageJsonPath = "admin/package.json";

export default async function updateMuiDependencies() {
    if (!existsSync(adminPackageJsonPath)) {
        return;
    }

    const packageJson = new PackageJson(adminPackageJsonPath);

    packageJson.updateDependency("@mui/material", "^7.0.0");
    packageJson.updateDependency("@mui/system", "^7.0.0");
    packageJson.updateDependency("@mui/utils", "^7.0.0");
    packageJson.updateDependency("@mui/icons-material", "^7.0.0");
    packageJson.updateDependency("@mui/lab", "^7.0.0-beta.9");

    packageJson.save();
}
