import { type ObjectLiteralExpression, Project, type PropertyAssignment, SyntaxKind } from "ts-morph";

/**
 * Update the configuration of the DamModule and BlobStorageModule and add ImgproxyModule to app.module.ts
 *
 * - Adds `cacheDirectory` to `BlobStorageModule.register`
 * - Adds `ImgproxyModule` import
 * - Add `maxSrcResolution` to `DamModule.register`
 * - Removes `cacheDirectory` and `imgproxyConfig` from `DamModule.register`
 */
export default async function updateDamConfiguration() {
    const project = new Project();
    const filePath = "api/src/app.module.ts"; // Update this path to your actual file path
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Update BlobStorageModule configuration
    const blobStorageModuleCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).find((call) => {
        const expression = call.getExpression();
        return expression.getText() === "BlobStorageModule.register";
    });

    if (blobStorageModuleCall) {
        const args = blobStorageModuleCall.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
            const objectLiteral = args[0] as ObjectLiteralExpression;
            const cacheDirectoryProperty = objectLiteral.getProperty("cacheDirectory");
            if (!cacheDirectoryProperty) {
                objectLiteral.addPropertyAssignment({
                    name: "cacheDirectory",
                    initializer: "`${config.blob.storageDirectoryPrefix}-cache`",
                });
            }
        }
    }

    // Add ImgproxyModule import
    sourceFile.addImportDeclaration({
        namedImports: ["ImgproxyModule"],
        moduleSpecifier: "@comet/cms-api",
    });

    // Add ImgproxyModule configuration
    const importsArray = sourceFile.getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression).find((array) => {
        const parent = array.getParent();
        return parent && parent.getKind() === SyntaxKind.PropertyAssignment && (parent as PropertyAssignment).getName() === "imports";
    });

    if (importsArray) {
        const imgproxyModuleCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).find((call) => {
            const expression = call.getExpression();
            return expression.getText() === "ImgproxyModule.register";
        });
        if (!imgproxyModuleCall) {
            importsArray.addElement("ImgproxyModule.register(config.imgproxy)");
        }
    }

    // Update DamModule configuration
    const damModuleCall = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).find((call) => {
        const expression = call.getExpression();
        return expression.getText() === "DamModule.register";
    });

    if (damModuleCall) {
        const args = damModuleCall.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
            const objectLiteral = args[0] as ObjectLiteralExpression;
            const damConfigProperty = objectLiteral.getProperty("damConfig");
            if (damConfigProperty && damConfigProperty.getKind() === SyntaxKind.PropertyAssignment) {
                const damConfigObject = (damConfigProperty as PropertyAssignment).getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                if (damConfigObject) {
                    const maxSrcResolutionProperty = damConfigObject.getProperty("maxSrcResolution");
                    if (!maxSrcResolutionProperty) {
                        damConfigObject.addPropertyAssignment({
                            name: "maxSrcResolution",
                            initializer: "config.dam.maxSrcResolution",
                        });
                    }
                    const cacheDirectoryProperty = damConfigObject.getProperty("cacheDirectory");
                    if (cacheDirectoryProperty) {
                        cacheDirectoryProperty.remove();
                    }
                }
            }
            const imgproxyConfigProperty = objectLiteral.getProperty("imgproxyConfig");
            if (imgproxyConfigProperty) {
                imgproxyConfigProperty.remove();
            }
        }
    }

    await project.save();
}
