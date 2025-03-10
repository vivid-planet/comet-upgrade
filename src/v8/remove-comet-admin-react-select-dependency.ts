import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

export default async function removeCometAdminReactSelectDependency() {
    if (!existsSync("admin/package.json")) {
        return;
    }

    const packageJson = new PackageJson("admin/package.json");
    packageJson.removeDependency("@comet/admin-react-select");
    packageJson.save();
}
