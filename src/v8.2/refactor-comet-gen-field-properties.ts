import { promises as fs } from "fs";
import { glob } from "glob";

/**
 * Refactors field properties in cometGen.ts / cometGen.tsx files:
 * - gqlName -> rootQueryArg
 * - fieldName: -> formFieldName:
 */
export default async function refactorCometGenFieldProperties() {
    const files: string[] = glob.sync("**/*cometGen.{ts,tsx}");

    for (const filePath of files) {
        let content = await fs.readFile(filePath, "utf-8");
        const originalContent = content;

        // Replace gqlName -> rootQueryArg
        content = content.replace(/\bgqlName\b/g, "rootQueryArg");

        // Replace object property name: -> formFieldName:
        content = content.replace(/\bfieldName\b:/g, "formFieldName:");

        if (content !== originalContent) {
            await fs.writeFile(filePath, content, "utf-8");
            console.log(`✅ Updated ${filePath}`);
        }
    }
}
