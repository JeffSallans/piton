-- pn-connectionString duckdb
-- pn-sqlDialect duckdb

-- pn-count
select *
from '{{pn-filePath}}data.csv'

-- pn-check
-- pn-id-col Id
SELECT *
from '{{pn-filePath}}data.csv'
where name is null or name = ''