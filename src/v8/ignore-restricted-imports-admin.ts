import { Project } from "ts-morph";

export const stage = "never";

export default async function ignoreRestrictedImportsAdmin() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    for (const sourceFile of sourceFiles) {
        const imports = sourceFile.getImportDeclarations();
        for (const imp of imports) {
            const module = imp.getModuleSpecifierValue();
            if (module === "@mui/material") {
                const namedImports = imp.getNamedImports().map((ni) => ni.getName());
                if (namedImports.includes("Button") || namedImports.includes("Dialog")) {
                    // Check for existing comments above
                    const statements = imp.getLeadingCommentRanges().map((r) => r.getText());
                    const hasEslintComment = statements.some((s) => s.includes("eslint-disable-next-line no-restricted-imports"));
                    if (!hasEslintComment) {
                        imp.replaceWithText(
                            `// TODO v8: remove eslint-disable-next-line\n// eslint-disable-next-line no-restricted-imports\n${imp.getText()}`,
                        );
                    }
                }
            }
        }
    }
    await project.save();
}
