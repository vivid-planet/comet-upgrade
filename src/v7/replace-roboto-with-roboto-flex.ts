import { readFile, writeFile } from "fs/promises";

import { executeCommand } from "../util/execute-command.util";
import { formatCode } from "../util/format-code.util";

/**
 * Replaces the old font package "Roboto" with the new "Roboto Flex"
 */
export default async function replaceRobotoWithRobotoFlex() {
    await replacePackageInPackageJson();

    await removeOldPackageImports();
    await addNewPackageImport();

    await executeCommand("npm", ["install", "--prefix", "admin", "--no-audit", "--loglevel", "error"]);
}

const replacePackageInPackageJson = async () => {
    const filePath = "admin/package.json";
    let fileContent = (await readFile(filePath)).toString();

    const searchString = "@fontsource/roboto";
    const re = new RegExp(`^.*${searchString}.*$`, "gm");
    fileContent = fileContent.replace(re, '    "@fontsource-variable/roboto-flex": "^5.0.0",');

    await writeFile(filePath, await formatCode(fileContent, filePath));
};

const removeOldPackageImports = async () => {
    const filePath = "admin/src/App.tsx";
    let fileContent = (await readFile(filePath)).toString();

    const searchString = 'import "@fontsource/roboto';
    const re = new RegExp(`^.*${searchString}.*$`, "gm");
    fileContent = fileContent.replace(re, "");

    await writeFile(filePath, await formatCode(fileContent, filePath));
};

const addNewPackageImport = async () => {
    const filePath = "admin/src/App.tsx";
    let fileContent = (await readFile(filePath)).toString();

    fileContent = `import "@fontsource-variable/roboto-flex/full.css";
    ${fileContent}`;

    await writeFile(filePath, await formatCode(fileContent, filePath));
};
