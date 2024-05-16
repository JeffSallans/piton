import { Range } from "vscode";
import { PitonFilePartResult } from "./PitonFilePartResult";

/** Contains details of part of the file */
export interface PitonFilePart {
    /**
     * @pn-count - Defines the count query for the file. On per file. Assume column 1, row 1 is the count
     * @pn-check - Defines a test query. Requires additional params
     * @pn-OnSuccess - Runs this section on pass. Terminated by @pn-OnSuccessEnd
     * @pn-OnFailure - Runs this section on failure. Terminated by @pn-OnFailureEnd
     * @pn-AlwaysAfter - Always runs no matter the result of the check part. Terminated by @pn-AlwaysAfterEnd
    */
    type: string;
    /** The part of the file this object covers */
    rawText: string;
    /** The query to run for the given query */
    sanitizedQuery: string;
    /** The order this part is, in the file */
    order: number;
    /** The start of the part */
    range: Range;

    /** Name of the file the part is in */
    fileName: string;

    /** True if the file part should be skipped */
    skip: boolean;

    /** Check params */

    /** Description to help organize things */
    name: string;

    /** The SQL result column name that is used to merge with the CSV review */
    idColumn: string;

    /** The SQL result column name that is used to determine if the row should fail the test */
    approveColumn: string;

    /** A word to help group results */
    tag: string;

    /** NOT IMPLEMENTED Can be no_result, column_to_equal, or result_matches_snapshot */
    expect: string;
    /** NOT IMPLEMENTED Name of the column returned to check for equality */
    expectColumn: string;
    /** NOT IMPLEMENTED What to compare that the column value is. Defaults to pass. */
    expectColumnValue: string;
}