import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const version = "8.0.0";
export const stage = "before-install";

export default async function updateNestDependencies() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.updateDependency("@mikro-orm/cli", "^6.0.0");
    packageJson.updateDependency("@mikro-orm/core", "^6.0.0");
    packageJson.updateDependency("@mikro-orm/migrations", "^6.0.0");
    packageJson.updateDependency("@mikro-orm/nestjs", "^6.0.2");
    packageJson.updateDependency("@mikro-orm/postgresql", "^6.0.0");

    packageJson.save();
}
