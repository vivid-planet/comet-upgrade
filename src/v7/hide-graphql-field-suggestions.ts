import { Project, SyntaxKind } from "ts-morph";

export const version = "7.0.0";

/**
 * Adds the `formatError` property to `GraphQLModule` options to hide `GraphQL` field suggestions for non dev environments.
 */
export default async function hideGraphqlFieldSuggestions() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/app.module.ts");
    if (!sourceFile) throw new Error("app.module.ts not found");

    // Add the required import statements
    sourceFile.addImportDeclaration({
        namedImports: ["ValidationError"],
        moduleSpecifier: "apollo-server-express",
    });

    sourceFile.addImportDeclaration({
        namedImports: ["ApolloDriverConfig"],
        moduleSpecifier: "@nestjs/apollo",
    });

    // Get the forRoot method within AppModule
    const forRootMethod = sourceFile.getClassOrThrow("AppModule").getMethodOrThrow("forRoot");

    // Get the GraphQLModule.forRootAsync call within the forRoot method
    const graphqlForRootCall = forRootMethod
        .getBody()
        ?.getDescendantsOfKind(SyntaxKind.CallExpression)
        .find((call) => call.getText().includes("GraphQLModule.forRootAsync"));
    if (!graphqlForRootCall) throw new Error("GraphQLModule.forRootAsync call not found within forRoot method.");

    // Add the generic type ApolloDriverConfig to the GraphQLModule.forRootAsync call
    if (!forRootMethod.getFullText().includes("GraphQLModule.forRootAsync<ApolloDriverConfig>")) {
        const expression = graphqlForRootCall.getExpression();
        if (!expression) throw new Error("Expression not found within GraphQLModule.forRootAsync call.");
        const expressionText = expression.getText();
        expression.replaceWithText(expressionText.replace(`${expressionText}`, `${expressionText}<ApolloDriverConfig>`));
    }

    const formatErrorImplText = `
        (error) => {
            if (process.env.NODE_ENV !== "development") {
                if (error instanceof ValidationError) {
                    return new ValidationError("Invalid request.");
                }
            }
            return error;
        }`;

    // return if property formatError already exists
    if (graphqlForRootCall.getArguments().find((arg) => arg.getText().includes("formatError"))) {
        throw new Error(
            `formatError property already exists in GraphQLModule.forRootAsync options. To be sure GraphQl field suggestions are disabled for non dev environments, please check if the implementation already contains: ${formatErrorImplText}`,
        );
    }

    // Find the useFactory function within the GraphQLModule.forRootAsync call
    const useFactoryFunction = graphqlForRootCall.getFirstDescendantByKindOrThrow(
        SyntaxKind.ArrowFunction,
        "useFactory function not found within GraphQLModule.forRootAsync call.",
    );
    if (!useFactoryFunction.getParent().getText().includes("useFactory"))
        throw new Error("useFactory function not found within GraphQLModule.forRootAsync call.");

    // Find the object literal being returned by the useFactory function
    const returnObjectLiteral = useFactoryFunction.getFirstDescendantByKindOrThrow(
        SyntaxKind.ObjectLiteralExpression,
        "Object literal not found within useFactory function.",
    );

    // Add your formatError to GraphQLModule.forRootAsync options
    returnObjectLiteral.addPropertyAssignment({
        name: "formatError",
        initializer: formatErrorImplText,
    });

    sourceFile.saveSync();
}
