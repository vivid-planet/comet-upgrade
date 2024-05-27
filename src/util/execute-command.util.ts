import { spawn } from "child_process";

// Inspired by https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/createReactApp.js#L383
export function executeCommand(command: string, args: string[] = []) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit" });

        child.on("close", (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(" ")}`,
                });
                return;
            }
            resolve();
        });
    });
}
