import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

/**
 * Custom type has been removed in favor of just type.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#removed-propertyoptionscustomtype-in-favour-of-just-type.
 */
export default async function replaceCustomType() {
    const files: string[] = glob.sync(["api/src/**/*.entity.ts"]);

    for (const filePath of files) {
        let fileContent = await readFile(filePath, "utf-8");

        fileContent = fileContent.replaceAll("customType:", "type:");

        await writeFile(filePath, fileContent);
    }
}
