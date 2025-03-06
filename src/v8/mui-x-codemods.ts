import { executeCommand } from "../util/execute-command.util";

export default async function executeMuiXCodemods() {
    await executeCommand("npx", ["@mui/x-codemod@latest", "v6.0.0/data-grid/preset-safe", "admin/src"]);
    await executeCommand("npx", ["@mui/x-codemod@latest", "v7.0.0/data-grid/preset-safe", "admin/src"]);
}
