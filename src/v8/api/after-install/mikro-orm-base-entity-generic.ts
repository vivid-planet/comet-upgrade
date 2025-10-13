import { readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";

/**
 * BaseEntity no longer has generic type arguments.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#baseentity-no-longer-has-generic-type-arguments.
 */
export default async function removeGenericFromBaseEntity() {
    const files: string[] = glob.sync(["api/src/**/*.entity.ts"]);

    for (const filePath of files) {
        let fileContent = await readFile(filePath, "utf-8");

        fileContent = fileContent.replaceAll(/BaseEntity<.*>/g, "BaseEntity");

        await writeFile(filePath, fileContent);
    }
}
