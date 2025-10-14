import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Removes the GraphQL client/fetch from the site preview handlers
 *
 * App Router: `sitePreviewRoute(request, createGraphQLFetch())` -> `sitePreviewRoute(request)`
 * Pages Router: `legacyPagesRouterSitePreviewApiHandler(req, res, createGraphQLClient())` -> `legacyPagesRouterSitePreviewApiHandler(req, res)`
 */
export default async function removeGraphQLClientFromSitePreviewHandlers() {
    const project = new Project({ tsConfigFilePath: "./site/tsconfig.json" });
    const files: string[] = glob.sync(["site/src/**/*.ts"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const importsSitePreviewRoute = Boolean(
            sourceFile.getImportDeclaration(
                (declaration) =>
                    declaration.getModuleSpecifierValue().includes("@comet/cms-site") &&
                    declaration
                        .getNamedImports()
                        .map((imp) => imp.getText())
                        .includes("sitePreviewRoute"),
            ),
        );

        if (importsSitePreviewRoute) {
            sourceFile.forEachDescendant((node) => {
                if (node.isKind(SyntaxKind.CallExpression)) {
                    const callExpr = node;
                    const expression = callExpr.getExpression();

                    if (expression.getText() === "sitePreviewRoute") {
                        if (callExpr.getArguments().length > 1) {
                            callExpr.removeArgument(1);
                        }
                    }
                }
            });
        }

        const legacyPagesRouterSitePreviewApiHandler = Boolean(
            sourceFile.getImportDeclaration(
                (declaration) =>
                    declaration.getModuleSpecifierValue().includes("@comet/cms-site") &&
                    declaration
                        .getNamedImports()
                        .map((imp) => imp.getText())
                        .includes("legacyPagesRouterSitePreviewApiHandler"),
            ),
        );

        if (legacyPagesRouterSitePreviewApiHandler) {
            sourceFile.forEachDescendant((node) => {
                if (node.isKind(SyntaxKind.CallExpression)) {
                    const callExpr = node;
                    const expression = callExpr.getExpression();

                    if (expression.getText() === "legacyPagesRouterSitePreviewApiHandler") {
                        if (callExpr.getArguments().length > 2) {
                            callExpr.removeArgument(2);
                        }
                    }
                }
            });
        }

        sourceFile.saveSync();
    }
}
