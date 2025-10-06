import { existsSync } from "fs";

import { PackageJson } from "../../../util/package-json.util";

export const stage = "before-install";

export default async function updateNextDependencies() {
    if (!existsSync("site/package.json")) {
        return;
    }

    const packageJson = new PackageJson("site/package.json");

    packageJson.updateDependency("next", "^15.5.4");
    packageJson.updateDependency("@next/bundle-analyzer", "^15.5.4");

    packageJson.updateDependency("react", "^19.2.0");
    packageJson.updateDependency("react-dom", "^19.2.0");
    packageJson.updateDependency("@types/react", "^19.2.0");
    packageJson.updateDependency("@types/react-dom", "^19.2.0");

    packageJson.save();
}
