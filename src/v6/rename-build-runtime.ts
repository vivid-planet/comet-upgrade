import { readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";

import { formatCode } from "../util/format-code.util.js";

/**
 * Renames BuildRuntime component to JobRuntime.
 */
export default async function renameBuildRuntime() {
    const files: string[] = glob.sync(["admin/src/**/*.tsx"]);

    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("BuildRuntime")) {
            continue;
        }

        fileContent = fileContent.replace(/BuildRuntime/g, "JobRuntime");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
