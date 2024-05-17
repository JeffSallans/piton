# Piton

Piton is a portable SQL testing VS Code Extension. The goal is to be an easy to use SQL tool for Quality Engineers.

## Installation

1. Download and install Piton from the [marketplace](https://marketplace.visualstudio.com/items?itemName=JeffSallans.piton)

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

## Supported SQL

* [pg](https://www.npmjs.com/package/pg)
* [duckdb](https://www.npmjs.com/package/duckdb)
* [sqlite](https://www.npmjs.com/package/sqlite)
* [oracle](https://www.npmjs.com/package/oracledb)

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

* duckdb overrides any approved values set in the .csv because of an ID issue
* the output will show bad parsing of the active file even if it is not .piton.sql type
* the run button does not disable if the job is running already

## Release Notes

Feature and bugfixes for each release.

### 0.8.2

* fixed sqlite connection issue

### 0.8.0

* Added a result.piton.csv to summarize the results
* Improved the sidebar to show more result data
* Added oracledb to sql dialects
* Added sqlite to sql dialects
* Added on hover hints for piton logic

### 0.7.0

Ready to review by co-workers

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

**Enjoy!**
