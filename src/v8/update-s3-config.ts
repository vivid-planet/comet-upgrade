import { Project, SyntaxKind } from "ts-morph";

export default async function updateS3Config() {
    const filePath = "api/src/config/config.ts";

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Find the createConfig function
    const createConfigFn = sourceFile.getFunctionOrThrow("createConfig");
    const returnStmt = createConfigFn.getBodyOrThrow().getDescendantsOfKind(SyntaxKind.ReturnStatement)[0];
    const returnObj = returnStmt.getExpressionIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    // Navigate to blob.storage.s3
    const blobProp = returnObj.getPropertyOrThrow("blob").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const storageProp = blobProp.getPropertyOrThrow("storage").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const s3Prop = storageProp.getPropertyOrThrow("s3").getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);

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
    }
}
