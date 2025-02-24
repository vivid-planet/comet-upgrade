import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { glob } from "glob";
import { Project } from "ts-morph";

import { PackageJson } from "../util/package-json.util";

export default async function updateThemeImports() {
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

    if (existsSync("admin/package.json")) {
        const packageJson = new PackageJson("admin/package.json");
        const themeVersion = packageJson.getDependencyVersion("@comet/admin-theme");
        packageJson.removeDependency("@comet/admin-theme");

        if (!packageJson.hasDependency("@comet/admin")) {
            packageJson.addDependency("@comet/admin", themeVersion || "^8.0.0");
        }

        packageJson.save();
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
