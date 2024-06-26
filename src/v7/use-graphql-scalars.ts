import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

import { executeCommand } from "../util/execute-command.util";
import { formatCode } from "../util/format-code.util";

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
    // before: import { GraphQLJSONObject } from "graphql-type-json";
    // after: import { GraphQLJSONObject } from "graphql-scalars";
    const files: string[] = glob.sync(["api/src/**/*.ts"]);
    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("graphql-type-json")) {
            continue;
        }

        fileContent = fileContent.replace(/graphql-type-json/g, "graphql-scalars");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
