import { glob } from "glob";
import { Project, SyntaxKind } from "ts-morph";

export const version = "8.0.0";

/**
 * This codemod changes `muiGridSortToGql` method from @comet/admin package.
 *
 * The function muiGridSortToGql arguments changed from `apiRef?: ReturnType<typeof useGridApiRef> to columns?: GridColDef[] introduced in Pull Request: https://github.com/vivid-planet/comet/pull/2763
 *
 * Change from:
 * -  muiGridSortToGql(dataGridRemote.sortModel, persistentColumnState.apiRef);
 * +  muiGridSortToGql(dataGridRemote.sortModel, columns);
 *
 * assuming, with the drawback, that columns variable is already available in the current scope.
 */
export default async function updateMuiXVersion() {
    const project = new Project({ tsConfigFilePath: "./tsconfig.json" });
    const files: string[] = glob.sync(["src/**/*.ts", "src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

        callExpressions.forEach((callExpression) => {
            const expressionText = callExpression.getExpression().getText();
            if (expressionText === "muiGridSortToGql") {
                const args = callExpression.getArguments();
                if (args.length === 2) {
                    args[1].replaceWithText("columns"); // expect that there is a columns variable already available in the current scope
                }
            }
        });

        await sourceFile.save();
    }
}
