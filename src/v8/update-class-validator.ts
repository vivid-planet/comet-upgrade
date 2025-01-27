import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

export const version = "8.0.0";
export const stage = "before-install";

export default async function updateClassValidator() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = JSON.parse(await readFile("api/package.json", "utf-8"));

    if (packageJson.dependencies) {
        packageJson.dependencies["class-validator"] = "^0.14.0";
    }

    await writeFile("api/package.json", JSON.stringify(packageJson, null, 4));
}
