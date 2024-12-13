import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

export const stage = "before-install";

export default async function removePassport() {
    if (!existsSync("api/package.json")) {
        return;
    }

    const packageJson = JSON.parse(await readFile("api/package.json", "utf-8"));

    if (packageJson.dependencies) {
        packageJson.dependencies["@nestjs/jwt"] = "^10.2.0";
    }

    delete packageJson.dependencies["@nestjs/passport"];
    delete packageJson.dependencies["passport"];
    delete packageJson.dependencies["passport-http"];
    delete packageJson.dependencies["passport-http-bearer"];

    delete packageJson.devDependencies["@types/passport"];
    delete packageJson.devDependencies["@types/passport-http"];
    delete packageJson.devDependencies["@types/passport-http-bearer"];

    await writeFile("api/package.json", JSON.stringify(packageJson, null, 4));
}
