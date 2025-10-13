import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

import { formatCode } from "../util/format-code.util.js";

/**
 * Imports types from `@comet/admin-theme` in vendors.d.ts to allow using custom theme variants and colors
 */
export default async function importAdminThemeTypes() {
    const filePath = "admin/src/vendors.d.ts";
    const typeReference = '/// <reference types="@comet/admin-theme" />';

    let fileContent = "";
    if (fs.existsSync(filePath)) {
        fileContent = (await readFile(filePath)).toString();
    }

    if (fileContent.includes(typeReference)) {
        return;
    }

    fileContent = `${typeReference}
    
    ${fileContent}`;

    await writeFile(filePath, await formatCode(fileContent, filePath));
}
