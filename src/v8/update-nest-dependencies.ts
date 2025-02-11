import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const stage = "before-install";

export default async function updateNestDependencies() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.addDependency("@apollo/server", "^4.0.0");
    packageJson.removeDependency("apollo-server-core");
    packageJson.removeDependency("apollo-server-express");

    packageJson.updateDependency("@nestjs/apollo", "^12.0.0");
    packageJson.updateDependency("@nestjs/common", "^10.0.0");
    packageJson.updateDependency("@nestjs/core", "^10.0.0");
    packageJson.updateDependency("@nestjs/graphql", "^12.0.0");
    packageJson.updateDependency("@nestjs/platform-express", "^10.0.0");

    packageJson.updateDependency("graphql", "^16.6.0");

    packageJson.updateDependency("@golevelup/nestjs-discovery", "^4.0.0");

    packageJson.updateDependency("@nestjs/cli", "^10.0.0");
    packageJson.updateDependency("@nestjs/schematics", "^10.0.0");
    packageJson.updateDependency("@nestjs/testing", "^10.0.0");

    packageJson.save();
}
