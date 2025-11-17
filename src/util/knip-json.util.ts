import { existsSync, readFileSync, writeFileSync } from "node:fs";

type Json = {
    ignoreDependencies?: string[];
};

export class KnipJson {
    private path: string;
    private json: Json;

    constructor(path: string) {
        if (!existsSync(path)) {
            throw new Error("File does not exist");
        }

        this.path = path;
        this.json = JSON.parse(readFileSync(path, "utf-8"));
    }

    save() {
        writeFileSync(this.path, `${JSON.stringify(this.json, null, 4)}\n`);
    }

    addIgnoreDependency(packageName: string) {
        this.json.ignoreDependencies ??= [];
        if (!this.json.ignoreDependencies.includes(packageName)) {
            this.json.ignoreDependencies.push(packageName);
        }
    }
}
