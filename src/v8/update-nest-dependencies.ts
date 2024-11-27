import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

export const stage = "before-install";

function updateDependencyIfExists(dependencies: Record<string, string>, name: string, version: string) {
    if (dependencies[name]) {
        dependencies[name] = version;
    }
}

export default async function updateNestDependencies() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = JSON.parse(await readFile("api/package.json", "utf-8"));

    if (packageJson.dependencies) {
        packageJson.dependencies["@apollo/server"] = "^4.0.0";
        delete packageJson.dependencies["apollo-server-core"];
        delete packageJson.dependencies["apollo-server-express"];

        updateDependencyIfExists(packageJson.dependencies, "@nestjs/apollo", "^12.0.0");
        updateDependencyIfExists(packageJson.dependencies, "@nestjs/common", "^10.0.0");
        updateDependencyIfExists(packageJson.dependencies, "@nestjs/core", "^10.0.0");
        updateDependencyIfExists(packageJson.dependencies, "@nestjs/graphql", "^12.0.0");
        // TODO remove when https://github.com/vivid-planet/comet/pull/2809 has been merged
        updateDependencyIfExists(packageJson.dependencies, "@nestjs/passport", "^10.0.0");
        updateDependencyIfExists(packageJson.dependencies, "@nestjs/platform-express", "^10.0.0");

        updateDependencyIfExists(packageJson.dependencies, "graphql", "^16.6.0");

        updateDependencyIfExists(packageJson.dependencies, "nestjs-console", "^9.0.0");
        updateDependencyIfExists(packageJson.dependencies, "@golevelup/nestjs-discovery", "^4.0.0");
    }

    if (packageJson.devDependencies) {
        updateDependencyIfExists(packageJson.devDependencies, "@nestjs/cli", "^10.0.0");
        updateDependencyIfExists(packageJson.devDependencies, "@nestjs/schematics", "^10.0.0");
        updateDependencyIfExists(packageJson.devDependencies, "@nestjs/testing", "^10.0.0");
    }

    await writeFile("api/package.json", JSON.stringify(packageJson, null, 4));
}
