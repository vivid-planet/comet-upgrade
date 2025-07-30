import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

/**
 * readClipboard -> readClipboardText
 * writeClipboard -> writeClipboardText
 */
export default async function updateClipboardHelpers() {
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

        const cometAdminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/admin");

        const readClipboardImport = blocksAdminImport.getNamedImports().find((namedImport) => namedImport.getText() === "readClipboard");

        if (readClipboardImport) {
            // Remove old import
            readClipboardImport.remove();

            // Add new import
            if (cometAdminImport) {
                cometAdminImport.addNamedImports(["readClipboardText"]);
            } else {
                sourceFile.addImportDeclaration({
                    namedImports: ["readClipboardText"],
                    moduleSpecifier: "@comet/admin",
                });
            }

            // Update usages
            sourceFile
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .filter((node) => node.getText() === "readClipboard")
                .forEach((node) => node.replaceWithText("readClipboardText"));
        }

        const writeClipboardImport = blocksAdminImport.getNamedImports().find((namedImport) => namedImport.getText() === "writeClipboard");

        if (writeClipboardImport) {
            // Remove old import
            writeClipboardImport.remove();

            // Add new import
            if (cometAdminImport) {
                cometAdminImport.addNamedImports(["writeClipboardText"]);
            } else {
                sourceFile.addImportDeclaration({
                    namedImports: ["writeClipboardText"],
                    moduleSpecifier: "@comet/admin",
                });
            }

            // Update usages
            sourceFile
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .filter((node) => node.getText() === "writeClipboard")
                .forEach((node) => node.replaceWithText("writeClipboardText"));
        }

        if (blocksAdminImport.getNamedImports().length === 0) {
            blocksAdminImport.remove();
        }

        await sourceFile.save();
    }
}
