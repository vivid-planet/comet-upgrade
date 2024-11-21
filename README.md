# @comet/upgrade

Upgrade scripts for Comet DXP

## Usage

```sh
npx @comet/upgrade <target-version>
```

For example:

```sh
npx @comet/upgrade v4
```

You can also run a single upgrade script by providing the path to the script:

```sh
npx @comet/upgrade v7/hide-graphql-field-suggestions.ts
```

## Create a new upgrade script

1. Start the development process:

    ```sh
    npm start
    ```

2. Add a new script for the version you want to upgrade to, for instance, `src/v4/change-something.ts`.
   The script **must have a function as default export** that performs the changes. See [src/v4/remove-clear-types-script.ts](src/v4/remove-clear-types-script.ts) for an example.

3. Test the upgrade script

    Navigate to the project you want to upgrade:

    ```sh
    cd project-you-want-to-upgrade/
    ```

    Run the upgrade script. Replace `<path-to-comet-upgrade-repository>` with the location of the cloned comet-upgrade repository (e.g., `../comet-upgrade/`):

    ```sh
    <path-to-comet-upgrade-repository>/bin/index.js v4/change-something.ts
    ```

    Verify the changes in your project. If something is not as expected, adapt the upgrade script accordingly and then run it again on a clean state:

    ```sh
    git reset --hard HEAD

    <path-to-comet-upgrade-repository>/bin/index.js v4/change-something.ts
    ```
