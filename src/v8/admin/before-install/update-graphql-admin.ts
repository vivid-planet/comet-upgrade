import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateGraphqlAdmin() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const packageJson = new PackageJson("admin/package.json");

    packageJson.updateDependency("graphql", "^16.10.0");

    packageJson.save();
}
