import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Remove the second argument from sitePreviewRoute(request, createGraphQLFetch());
 */
export default async function removeGraphQLFetchFromSitePreviewRoute() {
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

        if (!importsSitePreviewRoute) {
            continue;
        }

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

        sourceFile.saveSync();
    }
}
