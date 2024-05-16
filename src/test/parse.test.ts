import * as assert from 'assert';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { getFile } from '../file/file-parser';
import { ExtensionSecretStorage } from '../logging-and-debugging/ExtensionSecretStorage';
import { PitonLanguageClient } from '../language/PitonLanguageClient';
// import * as myExtension from '../../extension';

suite('File Parsing Test Suite', () => {

	test('Simple Postgres File', async () => {

		ExtensionSecretStorage.mockActivate();
		PitonLanguageClient.activate();

		const result = await getFile('fake-path', 'example2.piton.sql', `
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example
-- pn-sqlDialect postgres

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

		`, () => { return Promise.resolve(''); });
		
		assert.equal(result.sqlDialect, 'postgres');
		assert.equal(result.connectionString, 'postgres://dbt_user:pn-password@localhost:5432/dbt_example');
		assert.equal(result.parts.length, 2);
	});

	test('Full Postgres File', async () => {

		ExtensionSecretStorage.mockActivate();
		PitonLanguageClient.activate();

		const result = await getFile('fake-path', 'example2.piton.sql', `
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example
-- pn-sqlDialect postgres

-- pn-count
-- test
select * -- Explaination
from public.piton_test
-- WHERE

-- pn-check
-- pn-name null check
-- pn-tag completeness
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''

		`, () => { return Promise.resolve(''); });

		assert.equal(result.parts.length, 2);		
		assert.equal(result.parts[1].name, 'null check');
		assert.equal(result.parts[1].tag, 'completeness');
		assert.equal(result.parts[1].idColumn, 'id');
		assert.equal(result.parts[1].approveColumn, 'approved');

	});
});
