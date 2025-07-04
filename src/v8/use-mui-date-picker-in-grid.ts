import { existsSync } from "node:fs";
import { Project } from "ts-morph";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Prepares the admin to use the MUI DatePicker in a grid.
 *
 * This codmod adds the necessary dependencies for using the MUI DatePicker in a grid
 * and sets up the LocalizationProvider in App.tsx.
 */
export default async function UseMuiDatePickerInGrid() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    // Add dependencies
    const packageJson = new PackageJson("admin/package.json");
    packageJson.addDependency("@mui/x-date-pickers", "^7.29.4");
    packageJson.addDependency("date-fns", "^4.1.0");
    packageJson.save();

    // Set up LocalizationProvider
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const appFile = project.getSourceFile("admin/src/App.tsx");

    if (!appFile) {
        console.error("🛑 App.tsx not found in admin/src. Skipping LocalizationProvider setup.");
        return;
    }

    // Add imports if they don't exist
    if (!appFile.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === "@mui/x-date-pickers")) {
        console.log("✅ Adding LocalizationProvider import to App.tsx");
        appFile.addImportDeclaration({
            moduleSpecifier: "@mui/x-date-pickers",
            namedImports: [{ name: "LocalizationProvider" }],
        });
    } else {
        console.log("☑️ LocalizationProvider import already exists in App.tsx");
    }

    if (!appFile.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === "@mui/x-date-pickers/AdapterDateFns")) {
        console.log("✅ Adding AdapterDateFns import to App.tsx");
        appFile.addImportDeclaration({
            moduleSpecifier: "@mui/x-date-pickers/AdapterDateFns",
            namedImports: [{ name: "AdapterDateFns" }],
        });
    } else {
        console.log("☑️ AdapterDateFns import already exists in App.tsx");
    }

    await appFile.save();
}
