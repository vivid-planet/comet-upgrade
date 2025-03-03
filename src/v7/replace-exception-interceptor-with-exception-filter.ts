import { Project, SyntaxKind } from "ts-morph";

/**
 * Replaces the old ExceptionInterceptor with the new ExceptionFilter
 */
export default async function replaceExceptionInterceptorWithExceptionFilter() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/main.ts");

    if (!sourceFile) {
        return;
    }

    const cmsApiImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/cms-api");

    if (!cmsApiImport) {
        return;
    }

    const exceptionInterceptorImport = cmsApiImport.getNamedImports().find((namedImport) => namedImport.getName() === "ExceptionInterceptor");

    if (!exceptionInterceptorImport) {
        return;
    }

    const bootstrap = sourceFile.getFirstDescendantByKind(SyntaxKind.FunctionDeclaration);

    if (!bootstrap) {
        return;
    }

    const useGlobalInterceptors = sourceFile
        .getDescendantsOfKind(SyntaxKind.ExpressionStatement)
        .find((node) => node.getText().includes("useGlobalInterceptors"));

    if (!useGlobalInterceptors) {
        return;
    }

    bootstrap.insertStatements(useGlobalInterceptors.getChildIndex() + 1, "app.useGlobalFilters(new ExceptionFilter(config.debug));");

    const exceptionInterceptor = useGlobalInterceptors
        .getDescendantsOfKind(SyntaxKind.NewExpression)
        .find((node) => node.getText().includes("ExceptionInterceptor"));

    if (exceptionInterceptor) {
        useGlobalInterceptors.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression).removeArgument(exceptionInterceptor);

        if (useGlobalInterceptors.getDescendantsOfKind(SyntaxKind.NewExpression).length === 0) {
            useGlobalInterceptors.remove();
        }
    }

    exceptionInterceptorImport.remove();
    cmsApiImport.addNamedImport("ExceptionFilter");

    await sourceFile.save();
}
