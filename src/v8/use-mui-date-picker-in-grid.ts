import { existsSync } from "node:fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Prepares the admin to use the MUI DatePicker in a grid.
 *
 * This codmod adds the necessary dependencies for using the MUI DatePicker in a grid.
 */
export default async function UseMuiDatePickerInGrid() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const packageJson = new PackageJson("admin/package.json");

    packageJson.addDependency("@mui/x-date-pickers", "^7.29.4");
    packageJson.addDependency("date-fns", "^4.1.0");
    packageJson.save();
}
