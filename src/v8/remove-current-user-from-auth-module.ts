import { Project, SyntaxKind } from "ts-morph";

export default async function removeCurrentUserFromAuthModule() {
    console.log("Remove Current User From Auth Module");

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });
    const sourceFiles = project.getSourceFiles("api/src/**/*.ts");
    sourceFiles.forEach((sourceFile) => {
        const createAuthResolverCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).find((callExpression) => {
            const expression = callExpression.getExpression();
            return expression.getText() === "createAuthResolver";
        });

        if (createAuthResolverCall) {
            const argument = createAuthResolverCall.getArguments()[0];
            if (argument && argument.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const objectLiteral = argument.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
                const currentUserProp = objectLiteral.getProperty("currentUser");
                if (currentUserProp) {
                    console.log("Found createAuthResolver and removed currentUser in ", sourceFile.getFilePath());

                    currentUserProp.remove();
                }
            }
        }
        sourceFile.save();
    });
}
