import { glob } from "glob";
import { Project, ts } from "ts-morph";

const renameMap: Record<string, string> = {
    IMenuContent: "MainNavigationContextValue",
    IWithMenu: "WithMainNavigation",
    Menu: "MainNavigation",
    MenuClassKey: "MainNavigationClassKey",
    MenuCollapsibleItem: "MainNavigationCollapsibleItem",
    MenuCollapsibleItemClassKey: "MainNavigationCollapsibleItemClassKey",
    MenuCollapsibleItemProps: "MainNavigationCollapsibleItemProps",
    MenuContext: "useMainNavigation",
    MenuItem: "MainNavigationItem",
    MenuItemAnchorLink: "MainNavigationItemAnchorLink",
    MenuItemAnchorLinkProps: "MainNavigationItemAnchorLinkProps",
    MenuItemClassKey: "MainNavigationItemClassKey",
    MenuItemGroup: "MainNavigationItemGroup",
    MenuItemGroupClassKey: "MainNavigationItemGroupClassKey",
    MenuItemGroupProps: "MainNavigationItemGroupProps",
    MenuItemProps: "MainNavigationItemProps",
    MenuItemRouterLink: "MainNavigationItemRouterLink",
    MenuItemRouterLinkProps: "MainNavigationItemRouterLinkProps",
    MenuProps: "MainNavigationProps",
    withMenu: "withMainNavigation",
};

export default async function renameComponents() {
    const project = new Project({ tsConfigFilePath: "./admin/tsconfig.json" });
    const files: string[] = glob.sync(["admin/src/**/*.tsx"]);

    for (const filePath of files) {
        const sourceFile = project.getSourceFile(filePath);

        if (!sourceFile) {
            throw new Error(`Can't get source file for ${filePath}`);
        }

        const adminImport = sourceFile.getImportDeclaration((declaration) => declaration.getModuleSpecifierValue() === "@comet/admin");

        if (adminImport) {
            const namedImports = adminImport.getNamedImports();

            for (const [oldName, newName] of Object.entries(renameMap)) {
                const namedImport = namedImports.find((imported) => imported.getName() === oldName);

                if (namedImport) {
                    namedImport.setName(newName);

                    if (oldName === "MenuContext") {
                        const useContextCalls = sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression).filter((call) => {
                            const expression = call.getExpression();
                            return (
                                expression.getText() === "useContext" &&
                                call.getArguments().length === 1 &&
                                call.getArguments()[0].getText() === "MenuContext"
                            );
                        });

                        for (const call of useContextCalls) {
                            call.replaceWithText("useMainNavigation()");
                        }
                    } else {
                        const references = sourceFile
                            .getDescendantsOfKind(ts.SyntaxKind.Identifier)
                            .filter((identifier) => identifier.getText() === oldName);

                        for (const reference of references) {
                            reference.replaceWithText(newName);
                        }
                    }
                }
            }
        }

        await sourceFile.save();
    }
}
