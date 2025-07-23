import { Project } from "ts-morph";

export const stage = "never";

export default async function removeV8EslintDisableCommentsAdmin() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("admin/src/**/*.tsx");

    for (const sourceFile of sourceFiles) {
        const imports = sourceFile.getImportDeclarations();

        // Store comments to remove as [start, end] tuples
        const commentRangesToRemove: [number, number][] = [];

        for (const imp of imports) {
            const leadingComments = imp.getLeadingCommentRanges();

            for (let i = 0; i < leadingComments.length - 1; i++) {
                const first = leadingComments[i];
                const second = leadingComments[i + 1];

                const firstText = first.getText();
                const secondText = second.getText();

                if (
                    firstText.includes("TODO v8: remove eslint-disable-next-line") &&
                    secondText.includes("eslint-disable-next-line no-restricted-imports")
                ) {
                    // Mark both comments for removal
                    commentRangesToRemove.push([second.getPos(), second.getEnd()]);
                    commentRangesToRemove.push([first.getPos(), first.getEnd()]);
                }
            }
        }

        // Remove all comments from the file, in reverse order
        commentRangesToRemove
            .sort((a, b) => b[0] - a[0]) // Sort descending by start index
            .forEach(([start, end]) => {
                sourceFile.removeText(start, end);
            });
    }

    await project.save();
}
