import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { Project } from "ts-morph";

export const version = "8.0.0";

const renamedExports = {
    getMostSignificantPreviewImageUrlTemplate: "getMostSignificantPreviewImageUrlTemplateFromBlock",
    getPreviewImageUrlTemplates: "getPreviewImageUrlTemplatesFromBlock",
    getSearchText: "getSearchTextFromBlock",
    inputToData: "blockInputToData",
    TransformResponse: "TransformBlockResponse",
    TransformResponseArray: "TransformBlockResponseArray",
    transformToSave: "transformToBlockSave",
    transformToSaveIndex: "transformToBlockSaveIndex",
    TraversableTransformResponse: "TraversableTransformBlockResponse",
    TraversableTransformResponseArray: "TraversableTransformBlockResponseArray",
    typesafeMigrationPipe: "typeSafeBlockMigrationPipe",
};

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

        const importsToRename = Object.entries(renamedExports).filter(([oldExport]) => blocksApiImports.includes(oldExport));

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

        await sourceFile.save();

        let fileContent = (await readFile(filePath)).toString();

        for (const [oldExport, newExport] of importsToRename) {
            fileContent = fileContent.replaceAll(oldExport, newExport);
        }

        await writeFile(filePath, fileContent);
    }
}
