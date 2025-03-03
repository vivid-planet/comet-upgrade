import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { glob } from "glob";
import { Project } from "ts-morph";

export default async function mergeAdminThemeIntoAdmin() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.{ts,tsx}"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const themeImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/admin-theme");

        if (!themeImport) continue;

        const namedImports = themeImport.getNamedImports();
        const importStructures = namedImports.map((namedImport) => ({
            name: namedImport.getName(),
            alias: namedImport.getAliasNode()?.getText(),
        }));

        themeImport.remove();

        const adminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/admin");

        if (adminImport) {
            adminImport.addNamedImports(
                importStructures.map((importStructure) => ({
                    name: importStructure.name,
                    alias: importStructure.alias,
                })),
            );
        } else {
            sourceFile.addImportDeclaration({
                namedImports: importStructures.map((importStructure) => ({
                    name: importStructure.name,
                    alias: importStructure.alias,
                })),
                moduleSpecifier: "@comet/admin",
            });
        }

        await sourceFile.save();
    }

    const vendorsPath = "admin/src/vendors.d.ts";
    if (existsSync(vendorsPath)) {
        const content = readFileSync(vendorsPath, "utf-8");
        const updatedContent = content.replace('/// <reference types="@comet/admin-theme" />\n', "");

        if (updatedContent.trim() === "") {
            unlinkSync(vendorsPath);
        } else {
            writeFileSync(vendorsPath, updatedContent);
        }
    }
}
