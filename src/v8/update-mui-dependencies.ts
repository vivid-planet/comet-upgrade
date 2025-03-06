import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

const adminPackageJsonPath = "admin/package.json";

export default async function updateMuiDependencies() {
    if (!existsSync(adminPackageJsonPath)) {
        return;
    }

    const packageJson = new PackageJson(adminPackageJsonPath);

    packageJson.addDependency("@mui/material", "^6.0.0");
    packageJson.addDependency("@mui/system", "^6.0.0");
    packageJson.addDependency("@mui/utils", "^6.0.0");
    packageJson.addDependency("@mui/icons-material", "^6.0.0");
    packageJson.addDependency("@mui/lab", "^6.0.0-beta.10");

    packageJson.save();
}
