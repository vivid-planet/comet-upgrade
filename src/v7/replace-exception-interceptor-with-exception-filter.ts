import { readFile, writeFile } from "fs/promises";

import { formatCode } from "../util/format-code.util";

/**
 * Replaces the old ExceptionInterceptor with the new ExceptionFilter
 */
export default async function replaceExceptionInterceptorWithExceptionFilter() {
    const filePath = "api/src/main.ts";
    let fileContent = (await readFile(filePath)).toString();

    if (!fileContent.includes("ExceptionInterceptor")) {
        console.log("ExceptionInterceptor not found in main.ts. Make sure that you use the new ExceptionFilter.");
        return;
    }

    fileContent = fileContent.replace(
        "app.useGlobalInterceptors(new ExceptionInterceptor(config.debug));",
        "app.useGlobalFilters(new ExceptionFilter(config.debug));",
    );
    fileContent = fileContent.replace("ExceptionInterceptor", "ExceptionFilter");

    await writeFile(filePath, await formatCode(fileContent, filePath));
}
