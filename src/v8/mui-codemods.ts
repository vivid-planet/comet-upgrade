import { executeCommand } from "../util/execute-command.util";

export default async function executeMuiCodemods() {
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/list-item-button-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/styled", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/sx-prop", "admin/src"]);
    await executeCommand("npx", ["@mui/codemod@latest", "v6.0.0/theme-v6", "admin/src/theme.ts"]);
}
