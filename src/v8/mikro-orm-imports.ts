import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

export const version = "8.0.0";

/**
 * Always import form `@mikro-orm/postgresql`.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#all-drivers-now-re-export-the-mikro-ormcore-package.
 */
export default async function replaceImports() {
    const files: string[] = glob.sync(["api/src/**/*.entity.ts"]);

    for (const filePath of files) {
        let fileContent = await readFile(filePath, "utf-8");

        fileContent = fileContent.replaceAll("@mikro-orm/core", "@mikro-orm/postgresql");

        await writeFile(filePath, fileContent);
    }
}
