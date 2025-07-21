import { glob } from "glob";
import { Project } from "ts-morph";

export default async function removeReactBarrelImportsAdmin() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.ts", "admin/src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) continue;

        // Find and remove all imports of React from "react"
        const reactImports = sourceFile.getImportDeclarations().filter((imp) => imp.getModuleSpecifierValue() === "react");
        const namedUsages = new Set<string>();
        for (const imp of reactImports) {
            // Collect named imports (if any)
            const named = imp.getNamedImports().map((ni) => ni.getName());
            named.forEach((n) => namedUsages.add(n));
            // Remove the import
            imp.remove();
        }

        // Find usages of React.something and replace with something
        sourceFile.forEachDescendant((node) => {
            if (node.getKindName() === "PropertyAccessExpression") {
                const text = node.getText();
                if (text.startsWith("React.")) {
                    const member = text.replace("React.", "");
                    namedUsages.add(member);
                    node.replaceWithText(member);
                }
            }
        });

        // Add import { ... } from "react" for all used members
        if (namedUsages.size > 0) {
            sourceFile.addImportDeclaration({
                namedImports: Array.from(namedUsages),
                moduleSpecifier: "react",
            });
        }
    }
    await project.save();
}
