import { readFile, writeFile } from "fs/promises";
import { Project } from "ts-morph";

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

    const searchString = "app.useGlobalInterceptors\\(new ExceptionInterceptor\\(config.debug\\)\\);";
    const re = new RegExp(`^.*${searchString}.*$`, "gm");
    fileContent = fileContent.replace(re, "app.useGlobalFilters(new ExceptionFilter(config.debug));");

    await writeFile(filePath, await formatCode(fileContent, filePath));

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile(filePath);

    if (!sourceFile) {
        throw new Error(`Can't get source file for ${filePath}`);
    }

    sourceFile.addImportDeclaration({
        namedImports: ["ExceptionFilter"],
        moduleSpecifier: "@comet/cms-api",
    });

    sourceFile.saveSync();
}
