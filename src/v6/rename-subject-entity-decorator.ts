import { readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";

import { formatCode } from "../util/format-code.util.js";

/**
 * Renames @SubjectEntity() decorator to @AffectedEntity().
 */
export default async function renameSubjectEntityDecorator() {
    const files: string[] = glob.sync(["api/src/**/*.ts"]);

    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("SubjectEntity")) {
            continue;
        }

        fileContent = fileContent.replace(/SubjectEntity/g, "AffectedEntity");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
