import { writeFile } from "fs/promises";
import { existsSync } from "node:fs";

export const stage = "before-install";

/**
 * Replace node with version 22 in .nvmrc
 */
export default async function ReplaceNodeWithV22InNvmrc() {
    if (!existsSync(".nvmrc")) {
        console.warn("Your project doesn't have a .nvmrc file. Skipping the replacement of node version.");
        return;
    }

    await writeFile(".nvmrc", "22\n");
}
