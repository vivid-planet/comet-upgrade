import { Project, SyntaxKind } from "ts-morph";

export default async function removeTooltipTriggerProp() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });

    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    sourceFiles.forEach((sourceFile) => {
        const importDeclarations = sourceFile.getImportDeclarations();
        const tooltipImports = importDeclarations.filter((importDeclaration) => {
            const moduleSpecifier = importDeclaration.getModuleSpecifier().getLiteralValue();
            return moduleSpecifier === "@comet/admin";
        });

        if (tooltipImports.length > 0) {
            const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);

            jsxElements.forEach((jsxElement) => {
                const tagName = jsxElement.getTagNameNode().getText();
                if (tagName.includes("Tooltip")) {
                    const triggerProp = jsxElement
                        .getAttributes()
                        .find(
                            (attribute) =>
                                attribute.getKind() === SyntaxKind.JsxAttribute &&
                                attribute.asKind(SyntaxKind.JsxAttribute)?.getNameNode().getText() === "trigger",
                        );

                    if (triggerProp) {
                        triggerProp.remove();
                    }
                }
            });
            sourceFile.save();
        }
    });
}
