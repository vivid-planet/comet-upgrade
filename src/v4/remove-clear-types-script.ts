import fs from "fs";
import prettier from "prettier";

/**
 * Removes unnecessary clear:types script before GraphQL code generation that interferes with block code generation.
 */
export default async function removeClearTypesScript() {
    if (!fs.existsSync("site/package.json")) {
        return;
    }

    const sitePackageJson = JSON.parse(fs.readFileSync("site/package.json").toString());

    if (sitePackageJson.scripts["clear:types"]) {
        delete sitePackageJson.scripts["clear:types"];
    }

    if (sitePackageJson.scripts["gql:types"]) {
        sitePackageJson.scripts["gql:types"] = sitePackageJson.scripts["gql:types"].replace("npm run clear:types && ", "");
    }

    if (sitePackageJson.scripts["gql:watch"]) {
        sitePackageJson.scripts["gql:watch"] = sitePackageJson.scripts["gql:watch"].replace("npm run clear:types && ", "");
    }

    const prettierConfig = await prettier.resolveConfig(process.cwd());
    fs.writeFileSync("site/package.json", prettier.format(JSON.stringify(sitePackageJson), { ...prettierConfig, parser: "json" }));
}
