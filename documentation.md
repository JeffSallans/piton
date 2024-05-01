# Piton Documentation

Details on the Piton SQL annotations.

## Simple File

```sql
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example
-- pn-sqlDialect postgres

-- pn-count
select * -- Explaination
from public.piton_test

-- pn-check
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''

```

## Documentation

* [pn-connectionString](#pn-connectionString)
* [pn-sqlDialect](#pn-sqlDialect)
* [pn-skip](#pn-skip)
* [pn-count](#pn-count)
* [pn-execute](#pn-execute)
* [pn-check](#pn-check)

### pn-connectionString

(Required) Need one per file. Used to define the database connection. 

| Param | Required | Defualt | Description |
| --- | --- | --- | --- |
| pn-password | Inline | N/A | Will trigger a prompt to enter a password to your computer's keystore. On run, pn-password will be replaced with the actual password |

> Click the 'update password' codelense to trigger the password prompt.

```sql
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example
```

### pn-sqlDialect

(Required) Need one per file. Used to define the database driver to use. Options: 
* postgres
* oracledb
* duckdb

```sql
-- pn-sqlDialect postgres
```

### pn-skip

(Optional) One per file. When set, the entire file will skip execution.

```sql
-- pn-skip
```

### pn-count

(Required) One per file. Annotates a query to determine record count for the file. This helps set context on scale.

> TIP: Make sure a newline is at the end of the query

```sql
-- pn-count
select *
from public.piton_test

```

### pn-execute

TBD

### pn-check

One per query. Annotates a query to determine the SQL check.

| Param | Required | Defualt | Description |
| --- | --- | --- | --- |
| pn-id-col | Required | | The column name to use to merge with results |
| pn-name   | Optional | Order # | Sets a human name to the test |
| pn-approve-col | Optional | approved | The column name to determine if a result has been reviewed and can be ignored |
| pn-ignore-cols | Optional | No Columns | WIP - Provide a list of columns separated by a comma to ignore when checking if the approval column should be carried over |
| pn-no-removed | Optional | False | WIP - Set if removed rows from the snapshot need to be reviewed to pass. |
| pn-filePath | Inline SQL | N/A | Use in your SQL to replace with the current file path |

```sql
-- pn-check
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''
```
