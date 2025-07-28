import { Project, SyntaxKind } from "ts-morph";

/**
 * From
 *
 * GraphQLModule.forRootAsync<ApolloDriverConfig>({
 *     useFactory: (moduleRef: ModuleRef) => ({
 *         playground: config.debug,
 *     }),
 * }),
 *
 * to
 *
 * GraphQLModule.forRootAsync<ApolloDriverConfig>({
 *     useFactory: (moduleRef: ModuleRef) => ({
 *         graphiql: config.debug ? { url: "/api/graphql" } : undefined,
 *         playground: false,
 *     }),
 * }),
 */
export default function () {
    const project = new Project();
    const filePath = "api/src/app.module.ts";
    const sourceFile = project.addSourceFileAtPath(filePath);

    for (const node of sourceFile.getDescendants()) {
        if (node.getKind() === SyntaxKind.CallExpression && node.getText().startsWith("GraphQLModule.forRootAsync")) {
            const callExpr = node.asKindOrThrow(SyntaxKind.CallExpression);
            const arg = callExpr.getArguments()[0];
            if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const obj = arg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
                const useFactoryProp = obj.getProperty("useFactory");
                if (useFactoryProp && useFactoryProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const useFactory = useFactoryProp.asKindOrThrow(SyntaxKind.PropertyAssignment);
                    const arrowFunc = useFactory.getInitializerIfKind(SyntaxKind.ArrowFunction);
                    if (arrowFunc) {
                        const body = arrowFunc.getBody();
                        if (body.getKind() === SyntaxKind.ParenthesizedExpression) {
                            const retObj = body.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);
                            if (retObj) {
                                if (retObj.getProperty("graphiql")) {
                                    return; // Already has graphiql property
                                }

                                // Replace playground: config.debug with playground: false
                                const playgroundProp = retObj.getProperty("playground");

                                if (playgroundProp) {
                                    playgroundProp.replaceWithText("playground: false");
                                }

                                const graphiqlProperty = retObj.insertPropertyAssignment(playgroundProp ? playgroundProp.getChildIndex() - 1 : 0, {
                                    name: "graphiql",
                                    initializer: 'config.debug ? { url: "/api/graphql" } : undefined',
                                });

                                graphiqlProperty.replaceWithText(`// eslint-disable-next-line @cspell/spellchecker\n${graphiqlProperty.getText()}`);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    sourceFile.saveSync();
}
