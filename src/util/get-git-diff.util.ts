import { execSync } from "node:child_process";

export function getGitDiff() {
    try {
        return execSync("git diff").toString(); // Capture the git diff as a string
    } catch (error) {
        console.error("Error fetching git diff:", error);
        return null;
    }
}
