export async function getLatestPackageVersion(packageName: string) {
    const url = `https://registry.npmjs.org/${packageName}/latest`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch package info: ${response.status} ${response.statusText}`);
        }

        const packageInfo = await response.json();
        return (packageInfo as { version: string }).version;
    } catch (error) {
        console.error(`Failed to fetch package info for ${packageName}: ${error}`);
        return null;
    }
}
