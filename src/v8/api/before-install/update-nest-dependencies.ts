import { existsSync } from "node:fs";

import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function updateNestDependencies() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.addDependency("@apollo/server", "^5.1.0");
    packageJson.addDependency("@as-integrations/express5", "^1.1.2");
    packageJson.removeDependency("apollo-server-core");
    packageJson.removeDependency("apollo-server-express");

    packageJson.updateDependency("@nestjs/apollo", "^13.2.1");
    packageJson.updateDependency("@nestjs/common", "^11.1.3");
    packageJson.updateDependency("@nestjs/core", "^11.1.3");
    packageJson.updateDependency("@nestjs/graphql", "^13.1.0");
    packageJson.updateDependency("@nestjs/mapped-types", "^2.1.0");
    packageJson.updateDependency("@nestjs/platform-express", "^11.1.3");
    packageJson.updateDependency("@nestjs/cli", "^11.0.7");
    packageJson.updateDependency("@nestjs/schematics", "^11.0.5");
    packageJson.updateDependency("@nestjs/testing", "^11.1.3");

    packageJson.updateDependency("graphql", "^16.10.0");

    packageJson.updateDependency("express", "^5.0.1");
    packageJson.updateDependency("@types/express", "^5.0.0");

    packageJson.updateDependency("@golevelup/nestjs-discovery", "^4.0.0");

    packageJson.save();
}
