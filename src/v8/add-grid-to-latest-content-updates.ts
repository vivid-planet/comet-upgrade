import { JsxElement, JsxOpeningElement, JsxSelfClosingElement, Node, Project, SyntaxKind } from "ts-morph";

/**
 * Wraps <LatestContentUpdates /> in <Grid size={{ xs: 12, lg: 6 }}> if not already wrapped, because internal
 * Grid wrapper of DashboardWidgetRoot got removed and must be applied in the parent.
 *
 * changes from:
 *
 *     <LatestContentUpdates />
 *
 * to:
 *
 *     <Grid size={{ xs: 12, lg: 6 }}>
 *         <LatestContentUpdates />
 *      </Grid>
 */
export default async function wrapLatestContentUpdatesWithGrid() {
    console.log("🔧 Wrap <LatestContentUpdates /> in <Grid size={...}> if needed");

    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    for (const sourceFile of sourceFiles) {
        let didChange = false;

        const latestElements: (JsxElement | JsxSelfClosingElement)[] = [
            ...sourceFile
                .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
                .filter((el) => el.getTagNameNode().getText() === "LatestContentUpdates"),
            ...sourceFile
                .getDescendantsOfKind(SyntaxKind.JsxElement)
                .filter((el) => el.getOpeningElement().getTagNameNode().getText() === "LatestContentUpdates"),
        ];

        for (const originalElement of latestElements) {
            const parentGrid = getNearestParentGrid(originalElement);

            const shouldWrap =
                !parentGrid || // not inside any Grid
                isGridContainer(parentGrid); // inside Grid with container

            if (!shouldWrap) continue;

            const elementText = originalElement.getText();

            const gridWrapper = `
<Grid 
    size={{
        xs: 12,
        lg: 6, 
    }}
>
    ${elementText}
</Grid>`;

            originalElement.replaceWithText(gridWrapper);
            didChange = true;
        }

        if (didChange) {
            const hasGridImport = sourceFile
                .getImportDeclarations()
                .some(
                    (importDecl) =>
                        importDecl.getModuleSpecifierValue() === "@mui/material" &&
                        importDecl.getNamedImports().some((named) => named.getName() === "Grid"),
                );

            if (!hasGridImport) {
                sourceFile.insertImportDeclaration(0, {
                    namedImports: ["Grid"],
                    moduleSpecifier: "@mui/material",
                });
            }

            await sourceFile.save();
            console.log(`✅ Updated: ${sourceFile.getFilePath()}`);
        }
    }
}

function getNearestParentGrid(node: Node): JsxOpeningElement | undefined {
    return node.getFirstAncestorByKind(SyntaxKind.JsxElement)?.getOpeningElement();
}

function isGridContainer(openingElement: JsxOpeningElement): boolean {
    if (openingElement.getTagNameNode().getText() !== "Grid") return false;

    return openingElement.getAttributes().some((attr) => {
        return attr.getKind() === SyntaxKind.JsxAttribute && attr.getFirstChildByKind(SyntaxKind.Identifier)?.getText() === "container";
    });
}
