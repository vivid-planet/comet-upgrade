import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

export default async function removePassport() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");
    packageJson.updateDependency("@nestjs/jwt", "^10.2.0");
    packageJson.removeDependency("@nestjs/passport");
    packageJson.removeDependency("passport");
    packageJson.removeDependency("passport-http");
    packageJson.removeDependency("passport-http-bearer");
    packageJson.removeDependency("@types/passport");
    packageJson.removeDependency("@types/passport-http");
    packageJson.removeDependency("@types/passport-http-bearer");
    await packageJson.save();
}
