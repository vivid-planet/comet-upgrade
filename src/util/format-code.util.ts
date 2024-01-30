import { ESLint } from "eslint";

export async function formatCode(code: string, filePath: string) {
    const eslint = new ESLint({ cwd: process.cwd(), fix: true });

    const lintResult = await eslint.lintText(code, { filePath });
    return lintResult[0]?.output ?? lintResult[0]?.source ?? code;
}
