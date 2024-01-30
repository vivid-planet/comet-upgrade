import { ESLint } from "eslint";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

/**
 * Renames @SubjectEntity() decorator to @AffectedEntity().
 */
export default async function renameSubjectEntityDecorator() {
    const eslint = new ESLint({ cwd: process.cwd(), fix: true });

    const files: string[] = glob.sync(["api/src/**/*.ts"]);

    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        if (!fileContent.includes("SubjectEntity")) {
            continue;
        }

        fileContent = fileContent.replace(/SubjectEntity/g, "AffectedEntity");
        const lintResult = await eslint.lintText(fileContent, { filePath });
        const lintOutput = lintResult[0] && lintResult[0].output ? lintResult[0].output : lintResult[0].source;
        await writeFile(filePath, lintOutput ?? fileContent);
    }
}
