import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateGraphqlSite() {
    if (!existsSync("site/package.json")) {
        return;
    }

    const packageJson = new PackageJson("site/package.json");

    packageJson.updateDependency("graphql", "^16.10.0");

    packageJson.save();
}
