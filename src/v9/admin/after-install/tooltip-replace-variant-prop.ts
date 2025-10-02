import { Project, SyntaxKind } from "ts-morph";

export default async function tooltipReplaceVariantProp() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    sourceFiles.forEach((sourceFile) => {
        const cometAdminImports = sourceFile.getImportDeclarations().filter((importDeclaration) => {
            return importDeclaration.getModuleSpecifier().getLiteralValue() === "@comet/admin";
        });

        if (cometAdminImports.length > 0) {
            const tooltipComponentNames = new Set<string>();

            cometAdminImports.forEach((importDeclaration) => {
                importDeclaration.getNamedImports().forEach((namedImport) => {
                    if (namedImport.getName() === "Tooltip") {
                        const aliasName = namedImport.getAliasNode();
                        tooltipComponentNames.add(aliasName ? aliasName.getText() : "Tooltip");
                    }
                });
            });

            const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);

            jsxElements.forEach((jsxElement) => {
                const componentName = jsxElement.getTagNameNode().getText();

                if (tooltipComponentNames.has(componentName)) {
                    const variantAttribute = jsxElement
                        .getAttributes()
                        .find(
                            (attribute) =>
                                attribute.getKind() === SyntaxKind.JsxAttribute &&
                                attribute.asKind(SyntaxKind.JsxAttribute)?.getNameNode().getText() === "variant",
                        );

                    if (variantAttribute) {
                        const jsxAttribute = variantAttribute.asKind(SyntaxKind.JsxAttribute);

                        if (jsxAttribute) {
                            const initializer = jsxAttribute.getInitializer();
                            let variantValue: string | null = null;

                            if (initializer) {
                                if (initializer.getKind() === SyntaxKind.StringLiteral) {
                                    variantValue = initializer.asKind(SyntaxKind.StringLiteral)?.getLiteralValue() || null;
                                } else if (initializer.getKind() === SyntaxKind.JsxExpression) {
                                    const expression = initializer.asKind(SyntaxKind.JsxExpression)?.getExpression();
                                    if (expression && expression.getKind() === SyntaxKind.StringLiteral) {
                                        variantValue = expression.asKind(SyntaxKind.StringLiteral)?.getLiteralValue() || null;
                                    }
                                }
                            }

                            if (variantValue) {
                                const isValueThatNoLongerExists = variantValue === "primary" || variantValue === "neutral";

                                if (isValueThatNoLongerExists) {
                                    variantAttribute.remove();
                                } else {
                                    jsxAttribute.getNameNode().replaceWithText("color");
                                }
                            }
                        }
                    }
                }
            });
            sourceFile.save();
        }
    });
}
