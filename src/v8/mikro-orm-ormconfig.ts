import { Project, SyntaxKind } from "ts-morph";

export const version = "8.0.0";

/**
 * Wrap the config in createOrmConfig with defineConfig
 */
export default async function replaceCustomType() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/db/ormconfig.ts");

    if (!sourceFile) {
        return;
    }

    sourceFile.addImportDeclaration({
        namedImports: ["defineConfig"],
        moduleSpecifier: "@mikro-orm/postgresql",
    });

    const config = sourceFile
        .getVariableStatementOrThrow("ormConfig")
        .getDeclarations()[0]
        .getInitializerIfKindOrThrow(SyntaxKind.CallExpression)
        .getArguments()[0];

    config.replaceWithText(`defineConfig(${config.getText()})`);

    await sourceFile.save();
}
