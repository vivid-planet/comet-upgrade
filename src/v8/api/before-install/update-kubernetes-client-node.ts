import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateKubernetesClientNode() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.updateDependency("@kubernetes/client-node", "^1.0.0");

    packageJson.save();
}
