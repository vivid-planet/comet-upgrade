import { JsxElement, JsxOpeningElement, JsxSelfClosingElement, Node, Project, SourceFile, SyntaxKind } from "ts-morph";

/**
 * Wraps <LatestContentUpdates /> and <DashboardWidgetRoot /> in <Grid size={{ xs: 12, lg: 6 }}> if not already wrapped,
 * because internal Grid wrapper of DashboardWidgetRoot got removed and must be applied in the parent.
 *
 * changes from:
 *
 *     <LatestContentUpdates />
 *     or
 *     <DashboardWidgetRoot />
 *
 * to:
 *
 *     <Grid size={{ xs: 12, lg: 6 }}>
 *         <LatestContentUpdates />
 *      </Grid>
 *      or
 *      <Grid size={{ xs: 12, lg: 6 }}>
 *         <DashboardWidgetRoot />
 *      </Grid>
 */
export default async function wrapLatestContentUpdatesWithGrid() {
    console.log("🔧 Wrap <LatestContentUpdates /> or <DashboardWidgetRoot /> in <Grid size={...}> if needed");

    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    for (const sourceFile of sourceFiles) {
        let didChange = false;

        // Find both component types
        const targetElements = findComponentsToWrap(sourceFile, ["LatestContentUpdates", "DashboardWidgetRoot"]);

        for (const originalElement of targetElements) {
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

/**
 * Find all instances of the specified component names that need to be wrapped in grids
 */
function findComponentsToWrap(sourceFile: SourceFile, componentNames: string[]): (JsxElement | JsxSelfClosingElement)[] {
    const elements: (JsxElement | JsxSelfClosingElement)[] = [];

    // Find self-closing elements like <Component />
    elements.push(
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).filter((el) => componentNames.includes(el.getTagNameNode().getText())),
    );

    // Find regular elements like <Component>...</Component>
    elements.push(
        ...sourceFile
            .getDescendantsOfKind(SyntaxKind.JsxElement)
            .filter((el) => componentNames.includes(el.getOpeningElement().getTagNameNode().getText())),
    );

    return elements;
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
