import { map } from "lodash";
import { CompletionItem, CompletionList, Diagnostic, DiagnosticCollection, DiagnosticSeverity, ProviderResult, Range, Uri, languages } from "vscode";

export class PitonLanguageClient {
    public static diagnosticCollection: DiagnosticCollection;
    public static diagnosticErrors: { filePath: string, range: Range, message: string }[] = [];

    public static clearDiagnosticErrors(filePath: string) {
        this.diagnosticErrors = (this.diagnosticErrors || []).filter(e => e.filePath !== filePath);
    }

    public static addDiagnosticErrors(filePath: string, range: Range, message: string) {
        this.diagnosticErrors.push({ filePath, range, message });
    }

    public static updateDiagnosticCollection(filePath: string) {
        const diagnostics = this.diagnosticErrors.filter(e => e.filePath = filePath).map(e => new Diagnostic(e.range, e.message, DiagnosticSeverity.Error))
        this.diagnosticCollection.set(Uri.parse(`file:${filePath}`), diagnostics);
    }

    public static activateDiagnostic() {
        PitonLanguageClient.diagnosticCollection = languages.createDiagnosticCollection('piton');
        this.diagnosticCollection.clear();
        return this.diagnosticCollection;
    }

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
                        label: 'pn-connectionString',
                        insertText: 'pn-connectionString',
                        detail: 'Defines the connection string to use',
                        documentation: `Example: 
-- pn-connectionString postgres://dbt_user:dbt_user@localhost:5432/dbt_example`
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
                    }
                ];
            }
        });
    }
}