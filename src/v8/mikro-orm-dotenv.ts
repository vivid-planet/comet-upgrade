import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

/**
 * Add a dotenv call to config.
 * See https://mikro-orm.io/docs/upgrading-v5-to-v6#env-files-are-no-longer-automatically-loaded.
 */
export default async function addDotenvCallToConfig() {
    if (!existsSync("api/src/db/ormconfig.cli.ts")) {
        return;
    }

    let fileContent = await readFile("api/src/db/ormconfig.cli.ts", "utf-8");

    fileContent = `import "dotenv/config";\n\n${fileContent}`;

    await writeFile("api/src/db/ormconfig.cli.ts", fileContent);
}
