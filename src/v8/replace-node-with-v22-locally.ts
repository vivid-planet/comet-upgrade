import { writeFile } from "fs/promises";
import { existsSync } from "node:fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Replace node with version 22 in .nvmrc and package.json files
 */
export default async function replaceNodeWithV22Locally() {
    if (existsSync(".nvmrc")) {
        await writeFile(".nvmrc", "22\n");
    } else {
        console.warn("Your project doesn't have a .nvmrc file. Skipping the replacement of node version.");
    }

    updateTypesNode("api");
    updateTypesNode("admin");
    updateTypesNode("site");
}

function updateTypesNode(microservice: string) {
    const path = `${microservice}/package.json`;
    if (existsSync(path)) {
        const packageJson = new PackageJson(path);
        packageJson.updateDependency("@types/node", "^22.0.0");
        packageJson.save();
    }
}
