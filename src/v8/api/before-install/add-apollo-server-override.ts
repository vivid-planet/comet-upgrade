import { existsSync } from "node:fs";

import { KnipJson } from "../../../util/knip-json.util.js";
import { PackageJson } from "../../../util/package-json.util.js";

export const stage = "before-install";

export default async function addApolloServerOverride() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = new PackageJson("api/package.json");

    packageJson.addOverride("@apollo/server-plugin-landing-page-graphql-playground", {
        "@apollo/server": "^5.1.0",
    });

    packageJson.save();

    try {
        const knipJson = new KnipJson("api/knip.json");

        knipJson.addIgnoreDependency("@as-integrations/express5");

        knipJson.save();
    } catch {
        console.warn("Couldn’t find api/knip.json. If you are using knip, you must add @as-integrations/express5 to ignoreDependencies manually.");
    }
}
