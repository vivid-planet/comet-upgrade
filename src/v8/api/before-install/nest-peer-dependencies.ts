import { existsSync } from "fs";

import { PackageJson } from "../../../util/package-json.util";

export const stage = "before-install";

/**
 * Add peer dependencies defined by NestJS to the project.
 */
export default async function addNestPeerDependencies() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.addDependency("class-transformer", "^0.5.1");
    packageJson.addDependency("reflect-metadata", "^0.2.2");
    packageJson.addDependency("rxjs", "^7.8.1");

    packageJson.save();
}
