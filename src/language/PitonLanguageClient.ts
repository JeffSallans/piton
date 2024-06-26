import { search } from "fast-fuzzy";
import { filter, map } from "lodash";
import { CompletionItem, CompletionList, Diagnostic, DiagnosticCollection, DiagnosticSeverity, Hover, ProviderResult, Range, Uri, languages } from "vscode";

/** Used to manage language extension documentation shown to the user */
export class PitonLanguageClient {
    /** The state of all language reported errors in the PROBLEMS tab */
    public static diagnosticCollection: DiagnosticCollection;
    /** Used to temporarly store the parsing data to do a bulk update at the end of parsing */
    public static diagnosticErrors: { filePath: string, range: Range, message: string }[] = [];

    /** Contains the metadata around the piton language */
    public static languageInfo: CompletionItem[] = [
        {
            label: 'pn-check',
            insertText: 'pn-check',
            detail: 'Identify SQL for a test',
            documentation: `Example:
\`\`\`sql
-- pn-check
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''
\`\`\`

Result:
id  name
1   Jeff
2
`
        },
        {
            label: 'pn-id-col',
            insertText: 'pn-id-col',
            detail: 'The column name to use to merge with results',
            documentation: `Param: (required) string - The name of the return column of the SQL statement

Example:
-- pn-check
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''

Result:
id  name
1   Jeff
2   
`
        },
        {
            label: 'pn-approve-col',
            insertText: 'pn-approve-col',
            detail: 'The column name to determine if a result has been reviewed and can be ignored',
            documentation: `Param: (optional) string - The name of the return column of the SQL statement

Example:
-- pn-check
-- pn-id-col id
-- pn-approve-col approved
select *
from public.piton_test
where name is null or name = ''

Result:
id  name    approved
1   Jeff    1
2           0
`
        },
        {
            label: 'pn-expect',
            insertText: 'pn-expect',
            detail: 'The type of check to perform on the query',
            documentation: `Param: (optional) string - One of the following expect options. Defaults to no_results.

Option:
no_results - Will check if no results are return, exceptions go into the .csv
snapshot - Will check if the return query matches exactly to the .csv currently stored

Example:
-- pn-check
-- pn-id-col id
-- pn-expect no_results
select *
from public.piton_test
where name is null or name = ''

Result:
id  name    approved
1   Jeff    1
2           0
`
        },
        {
            label: 'pn-connectionString',
            insertText: 'pn-connectionString',
            detail: 'Defines the connection string to use',
            documentation: `Examples: 

[postgres connection](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS)
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example

[oracle connection](https://www.connectionstrings.com/oracle-data-provider-for-net-odp-net/using-the-easy-connect-naming-method-aka-ez-connect/)
[oracle connection additional](https://docs.oracle.com/cd/E11882_01/appdev.112/e10646/oci01int.htm#LNOCI16167)
-- pn-connectionString ORACLE_USER/pn-password@localhost:1521/oradev

[sql server connection](https://learn.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlconnection.connectionstring?view=netframework-4.8.1)
-- pn-connectionString Server=localhost,1433;Database=database;User Id=username;Password=password;Encrypt=true

[sqlite connection](https://www.npmjs.com/package/sqlite#opening-the-database)
-- pn-connectionString pn-filePath/sqlite-example.db
-- pn-connectionString :memory:

[duckdb connection]()
-- pn-connectionString duckdb
`
},
        {
            label: 'pn-password',
            insertText: 'pn-password',
            detail: 'Placeholder that will be replaced by a password',
            documentation: `If this keyword exists in pn-connectionString the user will be prompted 
to enter a password for each unique pn-connectionString

You can use the "Update Password" action above the pn-connectionString to change the password

The password is not stored in memory it is directly saved and access from the OS Secure Key store.
See this for more details: https://dev.to/kompotkot/how-to-use-secretstorage-in-your-vscode-extensions-2hco

Example: 
-- pn-connectionString postgres://dbt_user:pn-password@localhost:5432/dbt_example`
        },
        {
            label: 'pn-sqlDialect',
            insertText: 'pn-sqlDialect',
            detail: 'Defines the SQL driver to use for the given file',
            documentation: `Options: 
* postgres
* oracle
* duckdb
* sqlite
* sqlserver

Example:
-- pn-sqlDialect postgres`
        },
        {
            label: 'pn-count',
            insertText: 'pn-count',
            detail: 'Defines the SQL to get the file count to help set context',
            documentation: `Example:
-- pn-count
select *
from public.piton_test`
        },
        {
            label: 'pn-skip',
            insertText: 'pn-skip',
            detail: 'Skips the entire test file if it exists',
            documentation: `Example:
-- pn-sqlDialect
-- pn-skip`
        },
        {
            label: 'pn-tag',
            insertText: 'pn-tag',
            detail: 'Used to categorize checks that show up on a summary report',
            documentation: `Example:
\`\`\`sql
-- pn-check
-- pn-name null check
-- pn-tag completeness
-- pn-id-col id
select *
from public.piton_test
where name is null or name = ''
\`\`\`

Result Summary:
file                name        tag             result      count   num_errors  num_to_review
sample.piton.sql    null check  completeness    Failed      5       1           2
`
        },
        {
            label: 'pn-filePath',
            insertText: 'pn-filePath',
            detail: 'Placeholder to be replaced by the relative path to the current file',
            documentation: `pn-filePath only work for queries and pn-connectionString.

If you are working with the following files: 
* C:/user/jsallans/workspace/test.piton.sql
* C:/user/jsallans/workspace/data.csv
* C:/user/jsallans/workspace/sqlite-data.db

The following code will be changed at run time:

Example:
\`\`\`sql
-- pn-connectionString pn-filePath/sqlite-data.db
-- pn-sqlDialect sqlite
\`\`\`

Result:
\`\`\`sql
-- pn-connectionString C:/user/jsallans/workspace/sqlite-data.db
-- pn-sqlDialect sqlite
\`\`\`
`
        }
    ];

    /**
     * Run at the start of parsing a file. Used to clear any previously reported diagnostic errors
     * @param filePath The file and folder for the file parsed, used as an identifier
     * @returns 
     */
    public static clearDiagnosticErrors(filePath: string) {
        if (filePath === undefined) { return; }
        const errors = this.diagnosticErrors || [];
        this.diagnosticErrors = filter(errors, e => e.filePath !== filePath); 
    }

    /**
     * Report an error when parsing a file to show to the user
     * @param filePath The file and folder for the file parsed, used as an identifier
     * @param range The location of the error squiggly line
     * @param message The message to display when hovering over the squiggly line and in the PROBLEMS tab
     * @returns 
     */
    public static addDiagnosticErrors(filePath: string, range: Range, message: string) {
        if (filePath === undefined) { return; }
        this.diagnosticErrors.push({ filePath, range, message });
    }

    /**
     * Run after parsing the file, re-renders all the parsing results reported by `addDiagnosticErrors()`
     * @param filePath The file and folder for the file parsed, used as an identifier
     * @returns 
     */
    public static updateDiagnosticCollection(filePath: string) {
        if (filePath === undefined) { return; }
        const diagnostics = this.diagnosticErrors.filter(e => e.filePath === filePath).map(e => new Diagnostic(e.range, e.message, DiagnosticSeverity.Error));
        this.diagnosticCollection.set(Uri.parse(`file:${filePath}`), diagnostics);
    }

    /** Run on extension activation. Returns a list of disposible to clean up when deactivating */
    public static activate() {
        let languageDisposible = [];

        // Setup diagnostics
        PitonLanguageClient.diagnosticCollection = languages.createDiagnosticCollection('piton');
        this.diagnosticCollection.clear();
        languageDisposible.push(this.diagnosticCollection);

        // Setup hover
        languageDisposible.push(
            languages.registerHoverProvider({language: 'sql'}, {
                provideHover(document, position, token): ProviderResult<Hover> {
                    // Gets the current word the user is hovering over
                    const wordRange = document.getWordRangeAtPosition(position);
                    const word = document.getText(wordRange);
                    if (word === 'pn') { return { contents: [] }; }

                    // Finds the best documentation around this word
                    const results = search(word, PitonLanguageClient.languageInfo, { keySelector: (e: CompletionItem) => `${e.label}`, threshold: 0.8 });
                    const contentOptions = map(results, (r) => `### ${r.label}\n\n#### ${r.detail}\n\n${r.documentation}`);
                    const contents = (contentOptions.length === 0) ? [] : [contentOptions[0]];
                    return {
                        contents,
                    };
                },
            })
        );

        // Setup autocomplete
        languageDisposible.push(languages.registerCompletionItemProvider({language: 'sql'}, {
            provideCompletionItems(document, position, token, context): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
                return PitonLanguageClient.languageInfo;
            }
        }));
        return languageDisposible;
    }
}