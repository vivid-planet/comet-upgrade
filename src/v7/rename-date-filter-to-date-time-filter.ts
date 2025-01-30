import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

import { formatCode } from "../util/format-code.util";

export const version = "7.0.0";

// Renames DateFilter to DateTimeFilter
export default async function renameDateFilterToDateTimeFilter() {
    const files: string[] = glob.sync(["api/src/**/*.ts"]);

    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("DateFilter")) {
            continue;
        }

        fileContent = fileContent.replace(/DateFilter/g, "DateTimeFilter");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
