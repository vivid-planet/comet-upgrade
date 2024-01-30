import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

import { formatCode } from "../util/format-code.util";

/**
 * Renames JobStatus enum to KubernetesJobStatus.
 */
export default async function renameJobStatusEnum() {
    const files: string[] = glob.sync(["api/src/**/*.ts"]);

    for (const filePath of files) {
        let fileContent = (await readFile(filePath)).toString();

        // Some of our projects have a custom JobStatus enum, so we need to check for that.
        if (!/import { .*JobStatus.*} from "@comet\/cms-api";/.test(fileContent)) {
            continue;
        }

        fileContent = fileContent.replace(/JobStatus/g, "KubernetesJobStatus");
        await writeFile(filePath, await formatCode(fileContent, filePath));
    }
}
