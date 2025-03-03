import { existsSync } from "node:fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

/**
 * Replace the nestjs-console package with nest-commander
 */
export default async function ReplaceNestJsConsoleWithNestCommander() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.removeDependency("nestjs-console");

    packageJson.addDependency("nest-commander", "^3.16.0");
    packageJson.addDependency("@types/inquirer", "^8.1.3", true);

    packageJson.save();
}
