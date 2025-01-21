import semver from "semver";

export async function getLatestPackageVersion(packageName: string, majorVersion?: number): Promise<string | null> {
    const url = `https://registry.npmjs.org/${packageName}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch package info: ${response.status} ${response.statusText}`);
        }

        const packageInfo = (await response.json()) as { version: string; versions: { [version: string]: unknown } };

        if (!majorVersion) {
            return packageInfo.version;
        }

        const versions: string[] = Object.keys(packageInfo.versions);
        const latestForMajor = versions.filter((version) => semver.satisfies(version, `^${majorVersion}.0.0`)).sort(semver.rcompare)[0];

        return latestForMajor || null;
    } catch (error) {
        console.error(`Failed to fetch package info for ${packageName}: ${error}`);
        return null;
    }
}
