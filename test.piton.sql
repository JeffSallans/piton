-- pn-connectionString postgres://dbt_user:dbt_user@localhost:5432/dbt_example
-- pn-sqlDialect postgres

-- pn-count
-- test
select * -- Explaination
from public.piton_test
-- WHERE

-- pn-check
-- pn-expect no_results
-- pn-results
select *
from public.piton_test
where name is null or name = ''
