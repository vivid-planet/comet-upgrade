import { existsSync } from "node:fs";
import { Project, SyntaxKind } from "ts-morph";

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

    // Check if LocalizationProvider is already in use
    const hasLocalizationProvider = appFile.getDescendantsOfKind(SyntaxKind.JsxElement).some((element) => {
        const openingTag = element.getOpeningElement().getTagNameNode().getText();
        return openingTag === "LocalizationProvider";
    });

    if (hasLocalizationProvider) {
        console.log("☑️ LocalizationProvider is already set up in App.tsx - skipping further steps in this codemod.");
        return;
    }

    // Add imports if they don't exist
    if (!appFile.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === "@mui/x-date-pickers")) {
        console.log("✅ Adding LocalizationProvider import to App.tsx");
        appFile.addImportDeclaration({
            moduleSpecifier: "@mui/x-date-pickers",
            namedImports: [{ name: "LocalizationProvider" }],
        });
    }

    if (!appFile.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === "@mui/x-date-pickers/AdapterDateFns")) {
        console.log("✅ Adding AdapterDateFns import to App.tsx");
        appFile.addImportDeclaration({
            moduleSpecifier: "@mui/x-date-pickers/AdapterDateFns",
            namedImports: [{ name: "AdapterDateFns" }],
        });
    }

    // Add date-fns locale import
    if (!appFile.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === "date-fns/locale")) {
        console.log("✅ Adding date-fns locale import to App.tsx");
        appFile.addImportDeclaration({
            moduleSpecifier: "date-fns/locale",
            namedImports: [{ name: "enUS" }],
        });
    }

    // Find MuiThemeProvider and wrap its content with LocalizationProvider
    const muiThemeProvider = appFile.getDescendantsOfKind(SyntaxKind.JsxElement).find((element) => {
        const openingTag = element.getOpeningElement().getTagNameNode().getText();
        return openingTag === "MuiThemeProvider" || openingTag === "ThemeProvider";
    });

    if (muiThemeProvider) {
        console.log("✅ Adding LocalizationProvider wrapper above MuiThemeProvider");
        muiThemeProvider.replaceWithText(`<LocalizationProvider 
                dateAdapter={AdapterDateFns}
                /* 
                 * TODO: If the application uses internationalization or another language than enUS,
                 * the locale must be adapted to the correct one from date-fns/locale
                 */
                adapterLocale={enUS}
            >
                ${muiThemeProvider.getText()}
            </LocalizationProvider>`);
    } else {
        console.error("🛑 Could not find MuiThemeProvider in App.tsx");
    }

    await appFile.save();
}
