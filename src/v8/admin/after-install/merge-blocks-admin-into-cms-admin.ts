import { readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";
import { Project } from "ts-morph";

const renamedExports = {
    createCompositeSetting: "createCompositeBlockField",
    createCompositeSettings: "createCompositeBlockFields",
    IPreviewContext: "BlockPreviewContext",
    PreviewStateInterface: "BlockPreviewStateInterface",
    AdminComponentPart: "BlockAdminComponentPart",
    AdminComponentButton: "BlockAdminComponentButton",
    AdminComponentNestedButton: "BlockAdminComponentNestedButton",
    AdminComponentPaper: "BlockAdminComponentPaper",
    useAdminComponentPaper: "useBlockAdminComponentPaper",
    AdminComponentRoot: "BlockAdminComponentRoot",
    AdminComponentSection: "BlockAdminComponentSection",
    AdminComponentSectionGroup: "BlockAdminComponentSectionGroup",
    AdminTabLabel: "BlockAdminTabLabel",
    AdminTabsProps: "BlockAdminTabsProps",
    AdminTabs: "BlockAdminTabs",
};

export default async function mergeBlocksAdminIntoCmsAdmin() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.ts", "admin/src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const blocksAdminImport = sourceFile.getImportDeclaration((declaration) =>
            declaration.getModuleSpecifierValue().includes("@comet/blocks-admin"),
        );

        if (!blocksAdminImport) {
            continue;
        }

        const blocksAdminImports = blocksAdminImport.getNamedImports().map((namedImport) => namedImport.getText());

        const importsToRename = Object.entries(renamedExports).filter(([oldExport]) => blocksAdminImports.includes(oldExport));

        blocksAdminImport.remove();

        const cmsAdminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue().includes("@comet/cms-admin"));

        if (cmsAdminImport) {
            cmsAdminImport.addNamedImports(blocksAdminImports);
        } else {
            sourceFile.addImportDeclaration({
                namedImports: blocksAdminImports,
                moduleSpecifier: "@comet/cms-admin",
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
