import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

import { executeCommand } from "../util/execute-command.util";
import { formatCode } from "../util/format-code.util";

export const version = "7.0.0";

export default async function useGraphqlScalars() {
    // replace graphql-type-json with graphql-scalars in api/package.json
    const packageJson = await readFile(`api/package.json`);
    if (!packageJson.includes("graphql-type-json")) {
        // if not found, it was not used in the project, so we can skip this migration
        console.log("graphql-type-json not found in api/package.json. Skipping migration.");
        return;
    }

    await executeCommand("npm", ["uninstall", "--prefix", "api", "--no-audit", "--loglevel", "error", "graphql-type-json"]);
    await executeCommand("npm", ["install", "--prefix", "api", "--no-audit", "--loglevel", "error", "graphql-scalars"]);

    // replace graphql-type-json with graphql-scalars in all api files
    // before: import { <GraphQLJSON|GraphQLJSONObject> } from "graphql-type-json"; or import <ImportedName> from "graphql-type-json";
    // after: import { <GraphQLJSON|GraphQLJSONObject> } from "graphql-scalars";
    const files: string[] = glob.sync(["api/src/**/*.ts"]);
    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();
        if (!fileContent.includes("graphql-type-json")) {
            continue;
        }

        // replace default imports (which is GraphQLJSON) from graphql-type-json. Because of the default import, the name can be anything.
        const defaultImportMatches = fileContent.match(/import ([a-zA-Z]+) from "graphql-type-json";/);
        if (defaultImportMatches) {
            // replace default import
            fileContent = fileContent.replace(
                new RegExp(`import ${defaultImportMatches[1]} from "graphql-type-json";`, "g"),
                `import { GraphQLJSON } from "graphql-scalars";`,
            );
            // replace all usages of the default import
            fileContent = fileContent.replace(new RegExp(`${defaultImportMatches[1]}`, "g"), "GraphQLJSON");
        }

        // replace the rest
        fileContent = fileContent.replace(/graphql-type-json/g, "graphql-scalars");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
