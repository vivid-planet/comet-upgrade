import { existsSync } from "fs";

import { PackageJson } from "../../../util/package-json.util";

export const stage = "before-install";

export default async function updateGraphqlSite() {
    if (!existsSync("site/package.json")) {
        return;
    }

    const packageJson = new PackageJson("site/package.json");

    packageJson.updateDependency("graphql", "^16.10.0");

    packageJson.save();
}
