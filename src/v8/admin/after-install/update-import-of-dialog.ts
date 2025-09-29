import { glob } from "glob";
import { Project } from "ts-morph";

export default async function updateImportOfDialog() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const adminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/admin");
        const adminImports = adminImport?.getNamedImports().map((namedImport) => namedImport.getText());

        if (adminImports) {
            if (adminImports.includes("Dialog")) {
                continue;
            }
        }

        const muiImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@mui/material");

        if (!muiImport) continue;

        const namedImports = muiImport.getNamedImports();
        const dialogImport = namedImports.find((namedImport) => namedImport.getText() === "Dialog");

        if (dialogImport) {
            dialogImport.remove();
        }

        if (muiImport.getNamedImports().length === 0) {
            muiImport.remove();
        }

        if (adminImport) {
            adminImport.addNamedImports(["Dialog"]);
        } else {
            sourceFile.addImportDeclaration({
                namedImports: ["Dialog"],
                moduleSpecifier: "@comet/admin",
            });
        }

        await sourceFile.save();
    }
}
