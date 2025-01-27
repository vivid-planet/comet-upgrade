import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

export const version = "8.0.0";
export const stage = "before-install";

export default async function removeBlocksPackages() {
    if (existsSync("api/package.json")) {
        let fileContent = (await readFile("api/package.json")).toString();
        fileContent = fileContent.replace(/\n\s*"@comet\/blocks-api".*$/m, "");
        await writeFile("api/package.json", fileContent);
    }
}
