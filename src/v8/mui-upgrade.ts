import { executeCommand } from "../util/execute-command.util";
import { updateDependencyVersion } from "../util/update-dependency-version.util";

export default async function updateMuiVersion() {
    await updateDependencyVersion("admin/package.json", "@mui/material", "^6.0.0");
    await updateDependencyVersion("admin/package.json", "@mui/system", "^6.0.0");
    await updateDependencyVersion("admin/package.json", "@mui/utils", "^6.0.0");
    await updateDependencyVersion("admin/package.json", "@mui/icons-material", "^6.0.0");
    await updateDependencyVersion("admin/package.json", "@mui/lab", "^6.0.0-beta.10");

    await executeCommand("npm", ["install", "--prefix", "admin", "--no-audit", "--loglevel", "error"]);

    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/list-item-button-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/styled", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/sx-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/theme-v6", "admin/src/theme.ts"]);
}
