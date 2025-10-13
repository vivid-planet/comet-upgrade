import { spawn } from "node:child_process";

// Inspired by https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/createReactApp.js#L383
export function executeCommand(command: string, args: string[] = [], options?: { silent?: boolean }) {
    return new Promise<void>((resolve, reject) => {
        console.debug("Executing command: ", command, args.join(" "));

        const stdio = options?.silent ? "ignore" : "inherit";
        const child = spawn(command, args, { stdio });

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
