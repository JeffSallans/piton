-- pn-connectionString pn-filePath/sqlite-example.db
-- pn-sqlDialect sqlite

-- pn-count
select *
from Studio_Ghibli

-- pn-check
-- pn-name has valid characters
-- pn-id-col Name
select *
from Studio_Ghibli
where Name like '%ä%'

-- pn-check
-- pn-expect snapshot
-- pn-id-col Name
select *
from Studio_Ghibli

