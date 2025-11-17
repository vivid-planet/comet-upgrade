import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateNextDependencies() {
    if (!existsSync("site/package.json")) {
        return;
    }

    const packageJson = new PackageJson("site/package.json");

    packageJson.updateDependency("next", "^16.0.3");
    packageJson.updateDependency("@next/bundle-analyzer", "^16.0.3");

    packageJson.updateDependency("react", "^19.2.0");
    packageJson.updateDependency("react-dom", "^19.2.0");
    packageJson.updateDependency("@types/react", "^19.2.0");
    packageJson.updateDependency("@types/react-dom", "^19.2.0");

    packageJson.save();
}
