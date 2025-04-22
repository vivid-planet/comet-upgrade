import { existsSync, readFileSync, writeFileSync } from "fs";
import prettier from "prettier";

export const stage = "before-install";

/**
 * Move the maxSrcResolution property from imgproxy to dam in comet-config.json
 */
export default async function moveMaxSrcResolutionInCometConfig() {
    const cometConfigPath = "api/src/comet-config.json";
    if (existsSync(cometConfigPath)) {
        const content = readFileSync(cometConfigPath, "utf-8");

        const config = JSON.parse(content);

        if (config.imgproxy && config.imgproxy.maxSrcResolution !== undefined) {
            config.dam.maxSrcResolution = config.imgproxy.maxSrcResolution;
            delete config.imgproxy.maxSrcResolution;
        }

        const prettierConfig = await prettier.resolveConfig(process.cwd());
        writeFileSync(cometConfigPath, prettier.format(JSON.stringify(config), { ...prettierConfig, parser: "json" }));
    }
}
