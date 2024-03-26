import { readFile, writeFile } from "fs/promises";

import { formatCode } from "../util/format-code.util";

/**
 * Imports types from `@comet/admin-theme` in vendors.d.ts to allow using custom theme variants and colors
 */
export default async function importAdminThemeTypes() {
    const filePath = "admin/src/vendors.d.ts";

    let fileContent = (await readFile(filePath)).toString();

    if (fileContent.includes('<reference types="@comet/admin-theme" />')) {
        return;
    }

    fileContent = `/// <reference types="@comet/admin-theme" />
    
    ${fileContent}`;
    await writeFile(filePath, await formatCode(fileContent, filePath));
}
