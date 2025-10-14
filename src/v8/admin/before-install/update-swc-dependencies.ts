import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateSwcDependencies() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const packageJson = new PackageJson("admin/package.json");

    packageJson.updateDependency("@vitejs/plugin-react-swc", "^3.8.0");
    packageJson.updateDependency("@swc/plugin-emotion", "^8.7.2");

    packageJson.save();
}
