-- pn-connectionString duckdb
-- pn-sqlDialect duckdb

-- pn-count
select *
from 'pn-filePathdata.csv'

-- pn-check
-- pn-id-col Id
SELECT *
from 'pn-filePathdata.csv'
where name is null or name = ''
