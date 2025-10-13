import { existsSync } from "node:fs";

import { Project, SyntaxKind } from "ts-morph";

/**
 * Removes the GraphQL client/fetch from the site preview handlers
 *
 * App Router: `sitePreviewRoute(request, createGraphQLFetch())` -> `sitePreviewRoute(request)`
 * Pages Router: `legacyPagesRouterSitePreviewApiHandler(req, res, createGraphQLClient())` -> `legacyPagesRouterSitePreviewApiHandler(req, res)`
 */
export default async function removeGraphQLClientFromSitePreviewHandlers() {
    const project = new Project({ tsConfigFilePath: "./site/tsconfig.json" });

    // App Router
    if (existsSync("site/src/app/api/site-preview/route.ts")) {
        const sourceFile = project.getSourceFile("site/src/app/api/site-preview/route.ts");

        if (!sourceFile) {
            throw new Error("Can't get source file for site/src/app/api/site-preview/route.ts");
        }

        const getFunction = sourceFile.getFunction("GET");

        if (getFunction) {
            const callExpression = getFunction.getFirstDescendantByKind(SyntaxKind.CallExpression);

            if (callExpression) {
                callExpression.removeArgument(1);
            }
        }

        await sourceFile.save();
    }

    // Pages Router
    let pagesRouterApiRouteFile: string | undefined;

    if (existsSync("site/src/pages/api/site-preview.page.ts")) {
        pagesRouterApiRouteFile = "site/src/pages/api/site-preview.page.ts";
    } else if (existsSync("site/src/pages/api/site-preview.ts")) {
        // Projects without .page.ts extension
        pagesRouterApiRouteFile = "site/src/pages/api/site-preview.ts";
    }

    if (pagesRouterApiRouteFile) {
        const sourceFile = project.getSourceFile(pagesRouterApiRouteFile);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${pagesRouterApiRouteFile}`);
        }

        const callExpression = sourceFile.getFirstDescendantByKind(SyntaxKind.CallExpression);

        if (callExpression) {
            callExpression.removeArgument(2);
        }

        await sourceFile.save();
    }
}
