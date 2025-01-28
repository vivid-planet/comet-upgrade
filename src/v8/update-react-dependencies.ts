import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

export default async function updateReactDependencies() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const packageJson = new PackageJson("admin/package.json");

    packageJson.updateDependency("react", "^18.3.1");
    packageJson.updateDependency("react-dom", "^18.3.1");
    packageJson.updateDependency("@types/react", "^18.3.18");
    packageJson.updateDependency("@types/react-dom", "^18.3.5");

    packageJson.save();
}
