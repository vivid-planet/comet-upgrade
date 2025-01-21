import path from "path";
import semver, { SemVer } from "semver";

import { microservices } from "../index";

function getInstalledPackageVersion(packageName: string, microservice?: string): string | null {
    try {
        const packageJsonPath = path.join(`${process.cwd()}${microservice ? `/${microservice}` : ""}`, "node_modules", packageName, "package.json");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const packageJson = require(packageJsonPath);
        return packageJson.version;
    } catch (error) {
        return null;
    }
}

export function getSmallestInstalledVersion(packages: Record<(typeof microservices)[number], string[]>, devDepdencies: string[]) {
    const rootVersions = devDepdencies.map((packageName) => {
        return getInstalledPackageVersion(packageName);
    });

    const microServiceVersions = microservices
        .map((microservice) => {
            const devDependencyVersions = devDepdencies.map((packageName) => {
                return getInstalledPackageVersion(packageName, microservice);
            });

            const dependencyVersions = packages[microservice].map((packageName) => {
                return getInstalledPackageVersion(packageName, microservice);
            });

            return [...devDependencyVersions, ...dependencyVersions];
        })
        .flat();

    const allVersions = [...rootVersions, ...microServiceVersions].filter((version) => version !== null) as string[];

    const sortedVersions = allVersions.map((version) => semver.coerce(version) as SemVer).sort(semver.rcompare);

    return sortedVersions[0].version;
}
