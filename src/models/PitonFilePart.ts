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
    rawText: string;
    sanitizedQuery: string;
    order: number;
    /** The start of the part */
    range: Range;

    /** Check params */

    name: string;
    /** Can be no_result, column_to_equal, or result_matches_snapshot */
    expect: string;
    /** Name of the column returned to check for equality */
    expectColumn: string;
    /** What to compare that the column value is. Defaults to pass. */
    expectColumnValue: string;
}