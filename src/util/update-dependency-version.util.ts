import { readFile, writeFile } from "node:fs/promises";

import { formatCode } from "./format-code.util.js";

export async function updateDependencyVersion(packageJsonPath: string, packageName: string, newVersion: string) {
    const fileContent = (await readFile(packageJsonPath)).toString();
    const packageJson = JSON.parse(fileContent);

    if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        packageJson.dependencies[packageName] = newVersion;
    }

    const updatedContent = JSON.stringify(packageJson, null, 4);
    await writeFile(packageJsonPath, await formatCode(updatedContent, packageJsonPath));
}
