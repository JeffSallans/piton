-- pn-connectionString duckdb
-- pn-sqlDialect duckdb

-- pn-count
select *
from 'providers.csv'

-- pn-check
-- pn-id-col Id
SELECT *
from 'providers.csv'
where name is null or name = ''