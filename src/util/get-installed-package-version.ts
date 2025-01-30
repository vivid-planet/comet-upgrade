import path from "path";

export function getInstalledPackageVersion(packageName: string, microservice?: string): string | null {
    try {
        const packageJsonPath = path.join(`${process.cwd()}${microservice ? `/${microservice}` : ""}`, "node_modules", packageName, "package.json");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const packageJson = require(packageJsonPath);
        return packageJson.version;
    } catch (error) {
        return null;
    }
}
