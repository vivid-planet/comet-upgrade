import { promises as fs } from "node:fs";

import * as glob from "glob";

export const stage = "before-install";

/**
 * Replace node with version 22 in .gitlab-ci yml files
 */
export default async function replaceNodeWithV22InNvmrc() {
    const files = glob.sync("**/.gitlab-ci/*.yml", { nodir: true });

    for (const file of files) {
        let content = await fs.readFile(file, "utf8");

        content = content
            .replace(/node18/g, "node22")
            .replace(/node20/g, "node22")
            .replace(/nodejs18/g, "nodejs22-minimal")
            .replace(/nodejs20-minimal/g, "nodejs22-minimal")
            .replace(/nodejs20/g, "nodejs22-minimal");

        await fs.writeFile(file, content, "utf8");
    }

    console.log("Upgrade complete!");
}
