import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

/**
 * Removes the parent property from the PageTreeNode entity since the relation was moved to the library.
 */
export default async function removeParentNodeRelation() {
    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });
    const files: string[] = glob.sync(["api/src/**/page-tree-node.entity.ts"]);

    for (const filePath of files) {
        console.log(`Processing ${filePath}`);
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        // Find the class declaration for PageTreeNode
        const classDeclaration = sourceFile.getClassOrThrow("PageTreeNode");

        // Find the property declaration for parent and remove it along with its comment
        const parentProperty = classDeclaration.getProperty("parent");

        if (parentProperty) {
            // Remove the comment above the parent property
            const commentAbove = parentProperty.getPreviousSiblingIfKind(SyntaxKind.SingleLineCommentTrivia);

            if (commentAbove?.getText().includes("must be overwritten too because PageTreeNode is different from BasePageTreeNode")) {
                commentAbove.replaceWithText("");
            }

            parentProperty.remove();
        }

        await sourceFile.save();
    }
}
