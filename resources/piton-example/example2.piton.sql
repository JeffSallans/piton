-- pn-connectionString postgres://postgres:pn-password@localhost:5432/public
-- pn-sqlDialect postgres
-- pn-skip

-- pn-count
-- test
select * -- Explaination
from public.piton_test
-- WHERE

-- pn-check
-- pn-expect no_results
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''

