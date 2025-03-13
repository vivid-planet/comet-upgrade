import { readFile } from "fs/promises";
import { glob } from "glob";
import { Project } from "ts-morph";

/**
 * Replaces the import of `GridColDef` from `@mui/x-data-grid*` with `GridColDef` from `@comet/admin`.
 */
export default async function replaceGridColDefImport() {
    const files: string[] = glob.sync(["admin/src/**/*.ts", "admin/src/**/*.tsx"]);
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });

    for (const filePath of files) {
        const fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("GridColDef")) {
            continue;
        }

        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const dataGridImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue().includes("@mui/x-data-grid"));

        if (!dataGridImport) {
            continue;
        }

        dataGridImport
            .getNamedImports()
            .find((namedImport) => namedImport.getText() === "GridColDef")
            ?.remove();

        if (dataGridImport.getNamedImports().length === 0) {
            dataGridImport.remove();
        }

        sourceFile.addImportDeclaration({
            namedImports: ["GridColDef"],
            moduleSpecifier: "@comet/admin",
        });

        sourceFile.saveSync();
    }
}
