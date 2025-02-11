import { Node, Project, SyntaxKind, ts } from "ts-morph";

export default async function addDialogContentToEditDialog() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    sourceFiles.forEach((sourceFile) => {
        const importDeclarations = sourceFile.getImportDeclarations();
        const cometImport = importDeclarations.find(
            (importDeclaration) => importDeclaration.getModuleSpecifier().getLiteralValue() === "@comet/admin",
        );

        let hasEditDialogImport = false;

        if (cometImport) {
            hasEditDialogImport = cometImport.getNamedImports().some((namedImport) => namedImport.getName() === "EditDialog");
            if (hasEditDialogImport) {
                cometImport.addNamedImport("DialogContent");
            }
        }

        const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);

        const elementsToReplace: { node: Node<ts.Node>; newText: string }[] = [];

        jsxElements.forEach((jsxElement) => {
            const tagName = jsxElement.getOpeningElement().getTagNameNode().getText();
            if (tagName !== "EditDialog") return;

            const children = jsxElement.getJsxChildren();
            const functionAsChild = children.find((child) => Node.isJsxExpression(child) && Node.isArrowFunction(child.getExpression()));

            if (functionAsChild && Node.isJsxExpression(functionAsChild)) {
                const expression = functionAsChild.getExpression();
                if (!expression || !Node.isArrowFunction(expression)) return;

                const body = expression.getBody();
                const parameters = expression.getParameters();
                let wrappedContent: string;

                if (Node.isBlock(body)) {
                    const returnStatement = body.getStatements().find((statement) => Node.isReturnStatement(statement));
                    if (!returnStatement || !Node.isReturnStatement(returnStatement)) return;

                    let returnedExpression = returnStatement.getExpression();
                    if (returnedExpression && Node.isParenthesizedExpression(returnedExpression)) {
                        returnedExpression = returnedExpression.getExpression();
                    }

                    if (!returnedExpression) return;

                    if (Node.isJsxFragment(returnedExpression)) {
                        const fragmentChildren = returnedExpression.getChildrenOfKind(SyntaxKind.JsxElement);
                        const fragmentText = fragmentChildren.map((child) => child.getText()).join("\n");
                        wrappedContent = `(<DialogContent>\n${fragmentText}\n</DialogContent>)`;
                    } else {
                        const innerContent = returnedExpression.getText().replace(/\n/g, "\n");
                        wrappedContent = `(<DialogContent>\n${innerContent}\n</DialogContent>)`;
                    }

                    const newFunction = `{(${parameters.map((param) => param.getText()).join(", ")}) => {
                        return ${wrappedContent};}}`;
                    elementsToReplace.push({ node: functionAsChild, newText: newFunction });
                }
            } else {
                const openEditDialog = jsxElement.getOpeningElement().getText();
                const closeEditDialog = jsxElement.getClosingElement().getText();
                const childrensContent = children.map((child) => child.getText()).join("\n");

                const newContent = `${openEditDialog}\n<DialogContent>\n${childrensContent}\n</DialogContent>\n${closeEditDialog}`;
                elementsToReplace.push({ node: jsxElement, newText: newContent });
            }
        });

        elementsToReplace.forEach(({ node, newText }) => {
            node.replaceWithText(newText);
        });

        sourceFile.saveSync();
    });

    await project.save();
}
