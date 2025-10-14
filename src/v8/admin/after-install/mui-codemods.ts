import { executeCommand } from "../../../util/execute-command.util.js";

export default async function executeMuiCodemods() {
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/list-item-button-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/styled", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/sx-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/theme-v6", "admin/src/theme.ts"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v7.0.0/grid-props", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v7.0.0/input-label-size-normal-medium", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v7.0.0/lab-removed-components", "admin/src"]);
}
