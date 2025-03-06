import { existsSync, readFileSync, writeFileSync } from "fs";

type Json = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
};

export class PackageJson {
    private path: string;
    private json: Json;

    constructor(path: string) {
        if (!existsSync(path)) {
            throw new Error("File does not exist");
        }

        this.path = path;
        this.json = JSON.parse(readFileSync(path, "utf-8"));
    }

    addDependency(name: string, version: string, dev = false) {
        if (dev) {
            this.json.devDependencies ??= {};
            this.json.devDependencies[name] = version;
        } else {
            this.json.dependencies ??= {};
            this.json.dependencies[name] = version;
        }
    }

    updateDependency(name: string, version: string) {
        if (this.json.dependencies?.[name]) {
            this.json.dependencies[name] = version;
        }

        if (this.json.devDependencies?.[name]) {
            this.json.devDependencies[name] = version;
        }
    }

    removeDependency(name: string) {
        delete this.json.dependencies?.[name];
        delete this.json.devDependencies?.[name];
    }

    getDependencyVersion(name: string): string | undefined {
        return this.json.dependencies?.[name] || this.json.devDependencies?.[name];
    }

    hasDependency(name: string): boolean {
        return !!(this.json.dependencies?.[name] || this.json.devDependencies?.[name]);
    }

    save() {
        writeFileSync(this.path, JSON.stringify(this.json, null, 4));
    }

    addScript(name: string, script: string) {
        this.json.scripts ??= {};
        this.json.scripts[name] = script;
    }

    removeScript(name: string) {
        delete this.json.scripts?.[name];
    }
}
