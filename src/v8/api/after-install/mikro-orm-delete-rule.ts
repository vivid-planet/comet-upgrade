import { readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";

/**
 * onDelete has been renamed to deleteRule.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#renames.
 */
export default async function renameOnDelete() {
    const files: string[] = glob.sync(["api/src/**/*.entity.ts"]);

    for (const filePath of files) {
        let fileContent = await readFile(filePath, "utf-8");

        fileContent = fileContent.replaceAll("onDelete:", "deleteRule:");

        await writeFile(filePath, fileContent);
    }
}
