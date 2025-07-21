import { existsSync } from "fs";
import { Project, SyntaxKind } from "ts-morph";

import { PackageJson } from "../../../util/package-json.util";

export const stage = "before-install";

export default async function updateSentry() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");
    packageJson.updateDependency("@sentry/node", "^9.0.0");
    packageJson.save();

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });
    const sourceFile = project.getSourceFile("api/src/main.ts");
    if (!sourceFile) throw new Error("main.ts not found");

    sourceFile.getDescendantsOfKind(SyntaxKind.ExpressionStatement).forEach((node) => {
        if (node.getText() === "app.use(Sentry.Handlers.requestHandler());") {
            node.replaceWithText(`Sentry.setupExpressErrorHandler(app);`);
        } else if (node.getText() === "app.use(Sentry.Handlers.tracingHandler());") {
            node.remove();
        } else if (node.getText() === "app.use(Sentry.Handlers.errorHandler());") {
            node.remove();
        }
    });

    await sourceFile.save();
}
