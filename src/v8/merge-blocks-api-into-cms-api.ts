import { glob } from "glob";
import { Project } from "ts-morph";

export default async function mergeBlocksApiIntoCmsApi() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });
    const files: string[] = glob.sync(["api/src/**/*.ts"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const blocksApiImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue().includes("@comet/blocks-api"));

        if (!blocksApiImport) {
            continue;
        }

        const blocksApiImports = blocksApiImport.getNamedImports().map((namedImport) => namedImport.getText());

        blocksApiImport.remove();

        const cmsApiImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue().includes("@comet/cms-api"));

        if (cmsApiImport) {
            cmsApiImport.addNamedImports(blocksApiImports);
        } else {
            sourceFile.addImportDeclaration({
                namedImports: blocksApiImports,
                moduleSpecifier: "@comet/cms-api",
            });
        }

        sourceFile.saveSync();
    }
}
