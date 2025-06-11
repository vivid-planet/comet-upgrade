import { ObjectLiteralExpression, Project, SyntaxKind } from "ts-morph";

export default async function updateS3Config() {
    console.log(`🚀 Update s3 config to new structure.`);
    const filePath = "api/src/config/config.ts";

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Find the createConfig function
    const createConfigFn = sourceFile.getFunctionOrThrow("createConfig");
    const returnStmt = createConfigFn.getBodyOrThrow().getDescendantsOfKind(SyntaxKind.ReturnStatement)[0];
    const returnObj = returnStmt.getExpressionIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    // Navigate to blob.storage.s3
    let s3Prop: ObjectLiteralExpression;
    try {
        const blobProp = returnObj.getPropertyOrThrow("blob").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        const storageProp = blobProp.getPropertyOrThrow("storage").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        s3Prop = storageProp.getPropertyOrThrow("s3").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    } catch (error) {
        console.log("☑️  No S3 configuration found in the specified file. Skipping update.");
        return;
    }

    // Get accessKeyId and secretAccessKey
    const accessKeyIdProp = s3Prop.getProperty("accessKeyId");
    const secretAccessKeyProp = s3Prop.getProperty("secretAccessKey");

    if (accessKeyIdProp && secretAccessKeyProp) {
        s3Prop.addPropertyAssignment({
            name: "credentials",
            initializer: `{
                ${accessKeyIdProp.getText()},
                ${secretAccessKeyProp.getText()}
            }`,
        });
        accessKeyIdProp.remove();
        secretAccessKeyProp.remove();
        await sourceFile.save();
        console.log(`✅  Structure changed.`);
    }
}
