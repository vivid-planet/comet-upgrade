import { Project } from "ts-morph";

export default async function replaceMuiButtonWithCometAdminButton() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.{ts,tsx}");

    for (const sourceFile of sourceFiles) {
        let changed = false;
        const importDeclarations = sourceFile.getImportDeclarations();

        const cometAdminImport = importDeclarations.find((id) => id.getModuleSpecifierValue() === "@comet/admin");

        for (const importDecl of importDeclarations) {
            if (importDecl.getModuleSpecifierValue() === "@mui/material") {
                const namedImports = importDecl.getNamedImports();
                const buttonImport = namedImports.find((ni) => ni.getName() === "Button");
                if (buttonImport) {
                    // Remove Button from @mui/material import
                    buttonImport.remove();
                    changed = true;
                    // If no named imports left, remove the whole import
                    if (importDecl.getNamedImports().length === 0) {
                        importDecl.remove();
                    }
                }
            }
        }
        // Add Button import from @comet/admin if it was removed
        if (changed) {
            // Check if already imported from @comet/admin
            if (cometAdminImport) {
                // Add Button if not already present
                if (!cometAdminImport.getNamedImports().some((ni) => ni.getName() === "Button")) {
                    cometAdminImport.addNamedImport("Button");
                }
            } else {
                sourceFile.addImportDeclaration({
                    moduleSpecifier: "@comet/admin",
                    namedImports: ["Button"],
                });
            }
        }
        if (changed) {
            await sourceFile.save();
        }
    }
    await project.save();
}
