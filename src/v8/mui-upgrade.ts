import { existsSync } from "fs";

import { executeCommand } from "../util/execute-command.util";
import { updateDependencyVersion } from "../util/update-dependency-version.util";

export const version = "8.0.0";

const adminPackageJsonPath = "admin/package.json";

export default async function updateMuiVersion() {
    if (!existsSync(adminPackageJsonPath)) {
        return;
    }

    await updateDependencyVersion(adminPackageJsonPath, "@mui/material", "^6.0.0");
    await updateDependencyVersion(adminPackageJsonPath, "@mui/system", "^6.0.0");
    await updateDependencyVersion(adminPackageJsonPath, "@mui/utils", "^6.0.0");
    await updateDependencyVersion(adminPackageJsonPath, "@mui/icons-material", "^6.0.0");
    await updateDependencyVersion(adminPackageJsonPath, "@mui/lab", "^6.0.0-beta.10");

    await executeCommand("npm", ["install", "--prefix", "admin", "--no-audit", "--loglevel", "error"]);

    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/list-item-button-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/styled", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/sx-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/theme-v6", "admin/src/theme.ts"]);
}
