import { glob } from "glob";
import { Project, ts } from "ts-morph";

const renameMap: Record<string, string> = {
    IMenuContent: "IMainNavigation",
    IWithMenu: "IWithMainNavigation",
    Menu: "MainNavigation",
    MenuClassKey: "MainNavigationClassKey",
    MenuCollapsibleItem: "MainNavigationCollapsibleItem",
    MenuCollapsibleItemClassKey: "MainNavigationCollapsibleItemClassKey",
    MenuCollapsibleItemProps: "MainNavigationCollapsibleItemProps",
    MenuContext: "MainNavigationContext",
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

                    const references = sourceFile
                        .getDescendantsOfKind(ts.SyntaxKind.Identifier)
                        .filter((identifier) => identifier.getText() === oldName);

                    for (const reference of references) {
                        reference.replaceWithText(newName);
                    }
                }
            }
        }

        await sourceFile.save();
    }
}
