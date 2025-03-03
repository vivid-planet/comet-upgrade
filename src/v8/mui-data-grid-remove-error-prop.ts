import { Project, SyntaxKind } from "ts-morph";

export default async function removeMuiDataGridErrorProp() {
    console.log("Remove error prop from DataGrid and DataGridPro components");

    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });

    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    sourceFiles.forEach((sourceFile) => {
        const importDeclarations = sourceFile.getImportDeclarations();
        const dataGridImports = importDeclarations.filter((importDeclaration) => {
            const moduleSpecifier = importDeclaration.getModuleSpecifier().getLiteralValue();
            return moduleSpecifier === "@mui/x-data-grid" || moduleSpecifier === "@mui/x-data-grid-pro";
        });

        if (dataGridImports.length > 0) {
            const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

            jsxElements.forEach((jsxElement) => {
                const tagName = jsxElement.getTagNameNode().getText();
                if (tagName.includes("DataGrid") || tagName.includes("DataGridPro")) {
                    const errorProp = jsxElement.getAttributes().find((attribute) => {
                        if (attribute.getKind() === SyntaxKind.JsxAttribute) {
                            const jsxAttribute = attribute.asKind(SyntaxKind.JsxAttribute);
                            return jsxAttribute && jsxAttribute.getNameNode().getText() === "error";
                        }
                    });

                    if (errorProp) {
                        console.log(`✅  Removed error prop on ${tagName} at line: ${errorProp.getStartLineNumber()} in `, sourceFile.getFilePath());
                        errorProp.replaceWithText(`/* 
    @comet/upgrade 
    TODO: DataGrid's error prop got removed in @mui/x-data-grid(-pro) > v5.

    Recommended usage of errors is using parents ErrorBoundary: https://mui.com/x/migration/migration-data-grid-v5/#removed-props.

    \`\`\`  
    if (error) {  
        throw error  
    }  
    \`\`\`  
*/`);
                    }
                }
            });

            sourceFile.save();
        }
    });
}
