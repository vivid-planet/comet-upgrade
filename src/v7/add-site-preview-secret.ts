import fs from "fs";
import * as crypto from "node:crypto";
import { Project, SyntaxKind } from "ts-morph";

import { executeCommand } from "../util/execute-command.util";

export const version = "7.6.0";

export default async function addSitePreviewSecret() {
    updateApiFiles1();
    updateApiFiles2();
    updateApiFiles3();
    updateDotEnvFile();
    updateValuesTplFile();
    updateChart();
    await executeHelmDependencyUpdate();
}

function updateApiFiles1() {
    console.log("Add sitePreviewSecret to api/src/config/environment-variables.ts ...");

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/config/environment-variables.ts");
    if (!sourceFile) {
        console.error("  Could not file file, make sure to add SITE_PREVIEW_SECRET");
        return;
    }
    const cls = sourceFile.getClass("EnvironmentVariables");
    if (!cls) {
        console.error("  Could not class EnvironmentVariables, make sure to add SITE_PREVIEW_SECRET");
        return;
    }

    cls.addMember("\n@IsString()\n@MinLength(16)\nSITE_PREVIEW_SECRET: string;");
    sourceFile.saveSync();

    console.log("  finished");
}

async function updateApiFiles2() {
    console.log("Add sitePreviewSecret to api/src/config/config.ts ...");

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/config/config.ts");
    if (!sourceFile) {
        console.error("  Could not file file, make sure to add sitePreviewSecret: envVars.SITE_PREVIEW_SECRET");
        return;
    }

    sourceFile
        .getFunction("createConfig")
        ?.getBody()
        ?.getDescendantsOfKind(SyntaxKind.ReturnStatement)[0]
        .getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]
        .addProperty("sitePreviewSecret: envVars.SITE_PREVIEW_SECRET,");

    sourceFile.saveSync();

    console.log("  finished");
}

async function updateApiFiles3() {
    console.log("Add sitePreviewSecret to api/src/app.module.ts ...");

    const project = new Project({ tsConfigFilePath: "./api/tsconfig.json" });

    const sourceFile = project.getSourceFile("api/src/app.module.ts");
    if (!sourceFile) {
        console.error("  Could not file file, make sure to add sitePreviewSecret to PageTreeModule");
        return;
    }

    sourceFile
        .getClassOrThrow("AppModule")
        .getMethodOrThrow("forRoot")
        .getBody()
        ?.getDescendantsOfKind(SyntaxKind.CallExpression)
        .find((call) => call.getText().includes("PageTreeModule.forRoot"))
        ?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]
        .addProperty("sitePreviewSecret: config.sitePreviewSecret,");

    sourceFile.saveSync();

    console.log("  finished");
}

function updateDotEnvFile() {
    console.log("Update .env");
    if (!fs.existsSync(".env")) {
        console.error("  could not find file, please make sure to add SITE_PREVIEW_SECRET manually");
        return;
    }
    fs.appendFile(".env", `\nSITE_PREVIEW_SECRET=${crypto.randomBytes(8).toString("hex")}\n`, (err) => {
        console.error(`  ${err}`);
    });
    console.log("  finished");
}

function updateValuesTplFile() {
    const valuesFileName = "deployment/helm/values.tpl.yaml";

    console.log(`Update ${valuesFileName}`);

    if (!fs.existsSync(valuesFileName)) {
        console.error("  could not find file, please make sure to add SITE_PREVIEW_SECRET to api and remove authproxy-preview.");
        return;
    }

    const file = fs.readFileSync(valuesFileName, "utf8");
    const lines = file.split(/\n/);
    let currentSection = "";
    let sitePreviewLine = 0;
    let beginAuthproxyPreviewLine = 0;
    let endAuthproxyPreviewLine = 0;

    lines.forEach((line, index) => {
        const match = line.match(/(\s*)(.*):/);
        if (match) {
            if (match[1].length / 2 === 0) currentSection = match[2];
            if (currentSection === "api" && match[2] === "secrets") {
                sitePreviewLine = index;
            }
            if (currentSection === "authproxy-preview" && !beginAuthproxyPreviewLine) {
                beginAuthproxyPreviewLine = index;
            }
            if (currentSection !== "authproxy-preview" && beginAuthproxyPreviewLine > 0 && !endAuthproxyPreviewLine) {
                endAuthproxyPreviewLine = index;
            }
        }
    });

    if (sitePreviewLine) {
        lines.splice(sitePreviewLine, 0, '    SITE_PREVIEW_SECRET: "{{ op://$OP_PREFIX-$OP_ENVIRONMENT/site-preview-secret-$APP_ENV/password }}"');
    } else {
        console.error("  Could not find api.secrets, please make sure to add SITE_PREVIEW_SECRET manually.");
    }
    if (beginAuthproxyPreviewLine && endAuthproxyPreviewLine) {
        lines.splice(beginAuthproxyPreviewLine, endAuthproxyPreviewLine - beginAuthproxyPreviewLine);
    } else {
        console.error("  Could not find authproxy-preview. Please make sure to remove it from deployment manually.");
    }
    const content = lines.join("\n").replace(/oauth2-proxy-preview/g, "site");

    fs.writeFileSync(valuesFileName, content);

    console.log("  finished.");
}

function updateChart() {
    const filename = "deployment/helm/Chart.yaml";

    console.log(`Update ${filename}`);

    if (!fs.existsSync(filename)) {
        console.error("  could not find file, please make sure to remove authproxy-preview and execute helm dependency update.");
        return;
    }

    const file = fs.readFileSync(filename, "utf8");
    const lines = file.split(/\n/);
    let startingLine = 0;
    let isAuthproxyPreview = false;

    lines.forEach((line, index) => {
        const match1 = line.match(/-.*oauth2-proxy/);
        if (match1) {
            startingLine = index;
        }
        const match2 = line.match(/alias.*authproxy-preview/);
        if (match2) {
            isAuthproxyPreview = true;
        }
        const match3 = line.match(/- .*/);
        if (match3 && isAuthproxyPreview) {
            lines.splice(startingLine, index - startingLine);
            isAuthproxyPreview = false;
        }
    });

    const content = lines.join("\n").replace(/oauth2-proxy-preview/g, "site");
    fs.writeFileSync(filename, content);

    console.log("  finished.");
}

async function executeHelmDependencyUpdate() {
    console.log('Execute "helm dependency update deployment/helm" ...');

    await executeCommand("helm", ["dependency", "update", "deployment/helm"]);
}
