# Piton

Piton is a portable SQL testing VS Code Extension. The goal is to be an easy to use SQL tool for Quality Engineers.

## Installation

1. Download and install Piton from the [marketplace]()

1. Click the Piton icon on the sidebar

1. Click the "create piton example" button, this won't show if a .piton.sql exists already

1. Refresh the list to show 1 created file

1. Run the file and look at Piton output for the results

1. Optional - Install SQL Parser from the [marketplace](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools)

1. Optional - Install CSV Viewer from the [marketplace](https://marketplace.visualstudio.com/items?itemName=janisdd.vscode-edit-csv)

## Docs

[Docs](documentation.md)

## Example

```SQL
-- pn-connectionString duckdb
-- pn-sqlDialect duckdb

-- pn-count
select * -- Explaination
from public.piton_test
-- WHERE

-- pn-check
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''
```

## Why Another Testing Library?

There are more formal SQL testing frameworks that requires a lot of developer setup and assistance. The goal of this tool is to be lightweight and something a QA can add to their tool kit. Similar to show Postman is help QAs even when Swagger is used.

## Technology

* [pg](https://www.npmjs.com/package/pg)
* [duckdb](https://www.npmjs.com/package/duckdb)
* [lodash](https://www.npmjs.com/package/lodash)
* [dayjs](https://www.npmjs.com/package/dayjs)
* [json-2-csv](https://www.npmjs.com/package/json-2-csv)
* [vscode-extension](https://github.com/Microsoft/vscode-generator-code)

## Architecture

| layers |
| --- |
| VS Code Extension |
| V |
| File Runner |
| V |
| pg or duckdb |
| V |
| SQL DB |

## Known Issues

* Sometimes the Codelense will not be clickable until a file is closed and re-opened

## Release Notes

Feature and bugfixes for each release.

### 0.7.0

Ready to review by co-workers

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

**Enjoy!**
