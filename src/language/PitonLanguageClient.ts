import { CompletionItem, CompletionList, ProviderResult, languages } from "vscode";

export class PitonLanguageClient {
    public static activate() {
        return languages.registerCompletionItemProvider({language: 'sql'}, {
            provideCompletionItems(document, position, token, context): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
                return [
                    {
                        label: 'pn-check',
                        insertText: 'pn-check',
                        detail: 'Identify SQL for a test',
                        documentation: `Example:
-- pn-check
-- pn-id-col id
`
                    },
                    {
                        label: 'pn-connectionString',
                        insertText: 'pn-connectionString',
                        detail: 'Defines the connection string to use',
                        documentation: 'Example: \n-- pn-connectionString postgres://dbt_user:dbt_user@localhost:5432/dbt_example'
                    },
                    {
                        label: 'pn-sqlDialect',
                        insertText: 'pn-sqlDialect',
                        detail: 'Defines the SQL driver to use for the given file',
                        documentation: `Options: 
* postgres
* sqlServer
* oracle
* duckdb
* file://...
 
Example:
-- pn-sqlDialect postgres`
                    }
                ];
            }
        });
    }
}