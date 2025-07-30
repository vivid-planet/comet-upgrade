import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Replace UseRequestContext with CreateRequestContext
 */
export default async function mikroOrmCreateRequestContext() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const files: string[] = glob.sync("api/src/**/*.ts");

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            continue;
        }

        const mikroOrmCoreImport = sourceFile.getImportDeclaration(
            (importDeclaration) => importDeclaration.getModuleSpecifierValue() === "@mikro-orm/core",
        );

        if (!mikroOrmCoreImport) {
            continue;
        }

        const useRequestContextImport = mikroOrmCoreImport.getNamedImports().find((namedImport) => namedImport.getText() === "UseRequestContext");
        useRequestContextImport?.remove();

        if (!mikroOrmCoreImport.getNamedImports().find((namedImport) => namedImport.getText() === "CreateRequestContext")) {
            mikroOrmCoreImport.addNamedImport("CreateRequestContext");
        }

        sourceFile.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
            const identifier = decorator.getFirstDescendantByKind(SyntaxKind.Identifier);

            if (identifier && identifier.getText() === "UseRequestContext") {
                identifier.replaceWithText("CreateRequestContext");
            }
        });

        await sourceFile.save();
    }
}
