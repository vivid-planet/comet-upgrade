import { glob } from "glob";
import { JsxElement, Project, SyntaxKind } from "ts-morph";

export default async function cometConfigProvider() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });

    const appTsxFile = project.getSourceFile("admin/src/App.tsx");

    if (!appTsxFile) {
        return;
    }

    const cometConfigProviderImport = appTsxFile.getImportDeclaration(
        (importDeclaration) =>
            importDeclaration.getModuleSpecifierValue() === "@comet/cms-admin" &&
            importDeclaration.getNamedImports().some((namedImport) => namedImport.getName() === "CometConfigProvider"),
    );

    if (cometConfigProviderImport) {
        // Script has already been run, skip
        return;
    }

    const files: string[] = glob.sync(["admin/src/**/*.ts", "admin/src/**/*.tsx"]);

    let hasPageTree = false;

    // Renames and removals
    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            continue;
        }

        const cmsAdminImport = sourceFile.getImportDeclaration(
            (importDeclaration) => importDeclaration.getModuleSpecifierValue() === "@comet/cms-admin",
        );

        if (!cmsAdminImport) {
            continue;
        }

        // useLocale -> useContentLanguage
        const useLocaleImport = cmsAdminImport.getNamedImports().find((namedImport) => namedImport.getName() === "useLocale");

        if (useLocaleImport) {
            useLocaleImport.remove();
            cmsAdminImport.addNamedImport("useContentLanguage");

            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
                const identifier = callExpression.getFirstDescendantByKind(SyntaxKind.Identifier);

                if (identifier && identifier.getText() === "useLocale") {
                    identifier.replaceWithText("useContentLanguage");
                }
            });
        }

        // useSitesConfig -> useSiteConfigs
        const useSitesConfigImport = cmsAdminImport.getNamedImports().find((namedImport) => namedImport.getName() === "useSitesConfig");

        if (useSitesConfigImport) {
            useSitesConfigImport.remove();
            cmsAdminImport.addNamedImport("useSiteConfigs");

            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
                const identifier = callExpression.getFirstDescendantByKind(SyntaxKind.Identifier);

                if (identifier && identifier.getText() === "useSitesConfig") {
                    identifier.replaceWithText("useSiteConfigs");
                }
            });
        }

        // useCmsBlockContext -> useBlockContext
        const useCmsBlockContextImport = cmsAdminImport.getNamedImports().find((namedImport) => namedImport.getName() === "useCmsBlockContext");

        if (useCmsBlockContextImport) {
            useCmsBlockContextImport.remove();
            cmsAdminImport.addNamedImport("useBlockContext");

            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
                const identifier = callExpression.getFirstDescendantByKind(SyntaxKind.Identifier);

                if (identifier && identifier.getText() === "useCmsBlockContext") {
                    identifier.replaceWithText("useBlockContext");
                }
            });
        }

        // Remove allCategories prop from PagesPage component
        if (cmsAdminImport.getNamedImports().some((namedImport) => namedImport.getName() === "PagesPage")) {
            hasPageTree = true;

            [
                ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement), // <PagesPage>...</PagesPage>
                ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement), // <PagesPage />
            ].forEach((jsxElement) => {
                const tagName = jsxElement.getTagNameNode().getText();

                if (tagName === "PagesPage") {
                    const allCategoriesProp = jsxElement.getAttribute("allCategories");

                    if (allCategoriesProp) {
                        allCategoriesProp.remove();
                    }
                }
            });
        }

        await sourceFile.save();
    }

    // Rename sitesConfig -> siteConfigs
    for (const filePath of ["admin/src/config.ts", "admin/src/config.tsx"]) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            continue;
        }

        sourceFile
            .getFirstDescendant((node) => node.getKind() === SyntaxKind.Identifier && node.getText() === "sitesConfig")
            ?.replaceWithText("siteConfigs");

        await sourceFile.save();
    }

    // Merge config providers
    appTsxFile
        .getImportDeclaration((importDeclaration) => importDeclaration.getModuleSpecifierValue() === "@comet/cms-admin")
        ?.addNamedImport("CometConfigProvider");

    const rootJsxElement = appTsxFile.getFirstDescendantByKindOrThrow(SyntaxKind.JsxElement);

    rootJsxElement.replaceWithText(
        `<CometConfigProvider
            {...config}
            graphQLApiUrl={\`\${config.apiUrl}/graphql\`}
        >
            ${rootJsxElement.getFullText()}
        </CometConfigProvider>
        `,
    );

    const cometConfigProviderElement = appTsxFile.getFirstDescendantByKindOrThrow(SyntaxKind.JsxElement);
    const cometConfigProviderOpeningElement = cometConfigProviderElement.getFirstDescendantByKindOrThrow(SyntaxKind.JsxOpeningElement);

    // Application ConfigProvider
    const configProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "ConfigProvider",
    ) as JsxElement | undefined;

    if (configProviderElement) {
        configProviderElement.replaceWithText(
            configProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    let pageTreeCategoriesVariableName: string | undefined;
    let pageTreeDocumentTypesVariableName: string | undefined;
    let additionalPageTreeNodeFragmentVariableName: string | undefined;

    // CmsBlockContextProvider
    const cmsBlockContextProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "CmsBlockContextProvider",
    ) as JsxElement | undefined;

    if (cmsBlockContextProviderElement) {
        // Find variable names for page tree config
        const openingElement = cmsBlockContextProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        pageTreeCategoriesVariableName = openingElement
            .getAttribute("pageTreeCategories")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.Identifier)
            ?.getText();

        pageTreeDocumentTypesVariableName = openingElement
            .getAttribute("pageTreeDocumentTypes")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.Identifier)
            ?.getText();

        additionalPageTreeNodeFragmentVariableName = openingElement
            .getAttribute("additionalPageTreeNodeFragment")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.Identifier)
            ?.getText();

        cmsBlockContextProviderElement.replaceWithText(
            cmsBlockContextProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );

        // Remove apiClient variable
        appTsxFile
            .getFirstDescendant(
                (node) =>
                    node.getKind() === SyntaxKind.VariableStatement &&
                    node.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() === "apiClient",
            )
            ?.replaceWithText("");
    }

    // Page tree
    if (hasPageTree) {
        cometConfigProviderOpeningElement.addAttribute({
            name: "pageTree",
            initializer: `{{ 
                categories: ${pageTreeCategoriesVariableName ?? "pageTreeCategories"}, 
                documentTypes: ${pageTreeDocumentTypesVariableName ?? "pageTreeDocumentTypes"},
                ${additionalPageTreeNodeFragmentVariableName ? `additionalPageTreeNodeFragment: ${additionalPageTreeNodeFragmentVariableName},` : ""}
            }}`,
        });
    }

    // DAM
    const damConfigProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "DamConfigProvider",
    ) as JsxElement | undefined;

    if (damConfigProviderElement) {
        const openingElement = damConfigProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        const damConfig = openingElement
            .getAttribute("value")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);

        if (damConfig) {
            damConfig.insertSpreadAssignment(0, { expression: "config.dam" });
            cometConfigProviderOpeningElement.addAttribute({ name: "dam", initializer: `{${damConfig.getText()}}` });
        }

        cometConfigProviderOpeningElement.addAttribute({ name: "imgproxy", initializer: "{config.imgproxy}" });

        damConfigProviderElement.replaceWithText(
            damConfigProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    // Dependencies
    const dependenciesConfigProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "DependenciesConfigProvider",
    ) as JsxElement | undefined;

    if (dependenciesConfigProviderElement) {
        const openingElement = dependenciesConfigProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        const dependenciesConfig = openingElement
            .getAttribute("entityDependencyMap")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);

        if (dependenciesConfig) {
            cometConfigProviderOpeningElement.addAttribute({
                name: "dependencies",
                initializer: `{{entityDependencyMap: ${dependenciesConfig.getText()},}}`,
            });
        }

        dependenciesConfigProviderElement.replaceWithText(
            dependenciesConfigProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    // Site configs
    const siteConfigsProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "SitesConfigProvider",
    ) as JsxElement | undefined;

    if (siteConfigsProviderElement) {
        const openingElement = siteConfigsProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        const siteConfigsConfig = openingElement
            .getAttribute("value")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);

        if (siteConfigsConfig) {
            // configs: config.sitesConfig -> configs: config.siteConfigs
            siteConfigsConfig
                .getFirstDescendant(
                    (node) =>
                        node.getKind() === SyntaxKind.PropertyAssignment && node.getFirstChildByKind(SyntaxKind.Identifier)?.getText() === "configs",
                )
                ?.replaceWithText("configs: config.siteConfigs");

            cometConfigProviderOpeningElement.addAttribute({
                name: "siteConfigs",
                initializer: `{${siteConfigsConfig.getText()}}`,
            });
        }

        siteConfigsProviderElement.replaceWithText(
            siteConfigsProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    // Build information
    const buildInformationProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "BuildInformationProvider",
    ) as JsxElement | undefined;

    if (buildInformationProviderElement) {
        const openingElement = buildInformationProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        const buildInformationConfig = openingElement
            .getAttribute("value")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);

        if (buildInformationConfig) {
            cometConfigProviderOpeningElement.addAttribute({
                name: "buildInformation",
                initializer: `{${buildInformationConfig.getText()}}`,
            });
        }

        buildInformationProviderElement.replaceWithText(
            buildInformationProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    // Content language
    const localeProviderElement = cometConfigProviderElement.getFirstDescendant(
        (node) =>
            node.getKind() === SyntaxKind.JsxElement &&
            node.getFirstChildByKind(SyntaxKind.JsxOpeningElement)?.getTagNameNode().getText() === "LocaleProvider",
    ) as JsxElement | undefined;

    if (localeProviderElement) {
        const openingElement = localeProviderElement.getFirstChildByKindOrThrow(SyntaxKind.JsxOpeningElement);

        const resolveLocalForScopeFunction = openingElement
            .getAttribute("resolveLocaleForScope")
            ?.getFirstChildByKind(SyntaxKind.JsxExpression)
            ?.getFirstChildByKind(SyntaxKind.ArrowFunction);

        if (resolveLocalForScopeFunction) {
            cometConfigProviderOpeningElement.addAttribute({
                name: "contentLanguage",
                initializer: `{{ resolveContentLanguageForScope: ${resolveLocalForScopeFunction.getText()}, }}`,
            });
        }

        localeProviderElement.replaceWithText(
            localeProviderElement
                .getJsxChildren()
                .map((child) => child.getText())
                .join(""),
        );
    }

    await appTsxFile.save();
}
