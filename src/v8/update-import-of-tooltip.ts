import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { Project } from "ts-morph";

export default async function updateImportOfTooltip() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const adminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue().includes("@comet/admin"));
        const adminImports = adminImport?.getNamedImports().map((namedImport) => namedImport.getText());

        if (adminImports) {
            if (adminImports.includes("Tooltip")) {
                continue;
            }
        }

        const muiImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@mui/material");

        if (!muiImport) continue;

        const namedImports = muiImport.getNamedImports();
        const tooltipImport = namedImports.find((namedImport) => namedImport.getText() === "Tooltip");

        if (tooltipImport) {
            tooltipImport.remove();
        }

        if (muiImport.getNamedImports().length === 0) {
            muiImport.remove();
        }

        if (adminImport) {
            adminImport.addNamedImports(["Tooltip"]);
        } else {
            sourceFile.addImportDeclaration({
                namedImports: ["Tooltip"],
                moduleSpecifier: "@comet/admin",
            });
        }

        await sourceFile.save();

        const fileContent = (await readFile(filePath)).toString();

        await writeFile(filePath, fileContent);
    }
}
