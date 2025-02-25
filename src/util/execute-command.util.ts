import { spawn } from "child_process";

// Inspired by https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/createReactApp.js#L383
export function executeCommand(command: string, args: string[] = []) {
    return new Promise<string>((resolve, reject) => {
        let scriptOutput = "";
        console.log("Execute: ", `${command} ${args.join(" ")}`);
        const child = spawn(command, args, { shell: true });

        child.stdout?.on("data", (data) => {
            scriptOutput += data;
        });

        child.on("close", (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(" ")}`,
                });
                return;
            }
            console.log(scriptOutput);
            resolve(scriptOutput);
        });
    });
}
