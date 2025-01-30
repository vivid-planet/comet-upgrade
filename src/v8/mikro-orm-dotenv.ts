import { existsSync } from "fs";

import { PackageJson } from "../util/package-json.util";

export const version = "8.0.0";

/**
 * Adds a `mikro-orm` script to package.json that calls dotenv.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#env-files-are-no-longer-automatically-loaded.
 */
export default async function addDotenvCallToConfig() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.addScript("mikro-orm", "dotenv -e .env.secrets -e .env.local -e .env -e .env.site-configs -- mikro-orm");

    packageJson.save();
}
