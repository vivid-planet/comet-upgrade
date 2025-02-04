import { existsSync } from "fs";

import { executeCommand } from "../util/execute-command.util";
import { updateDependencyVersion } from "../util/update-dependency-version.util";

const adminPackageJsonPath = "admin/package.json";

/**
 * Update MUI X version to 6.0.0
 *
 * Migration Guide 5-6: https://mui.com/x/migration/migration-data-grid-v5
 *
 */
export default async function updateMuiXVersion() {
    if (!existsSync(adminPackageJsonPath)) {
        return;
    }

    await updateDependencyVersion(adminPackageJsonPath, "@mui/x-data-grid", "^6.0.0");
    await updateDependencyVersion(adminPackageJsonPath, "@mui/x-data-grid-pro", "^6.0.0");

    await executeCommand("npm", ["install", "--prefix", "admin", "--no-audit", "--loglevel", "error"]);

    await executeCommand("npx", ["@mui/x-codemod@latest", "v6.0.0/data-grid/preset-safe", "admin/src"]);
}
