import { Project, SyntaxKind } from "ts-morph";

/**
 * From
 *
 * if (error instanceof ValidationError) {
 *     return new ValidationError("Invalid request.");
 * }
 *
 * to
 *
 * if (error.extensions?.code === "GRAPHQL_VALIDATION_FAILED") {
 *      return new ValidationError("Invalid request.");
 * }
 */
export default async function updateGraphQLFormatError() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/app.module.ts");

    if (!sourceFile) {
        throw new Error("app.module.ts not found");
    }

    // Change the import
    sourceFile.getImportDeclaration((importDeclaration) => importDeclaration.getModuleSpecifierValue() === "apollo-server-express")?.remove();
    sourceFile.addImportDeclaration({ namedImports: ["ValidationError"], moduleSpecifier: "@nestjs/apollo" });

    // Update the if statement
    sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression).forEach((node) => {
        if (node.getText() === "error instanceof ValidationError") {
            node.replaceWithText(`error.extensions?.code === "GRAPHQL_VALIDATION_FAILED"`);
        }
    });

    await sourceFile.save();
}
