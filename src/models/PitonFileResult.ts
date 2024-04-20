import { PitonFile } from "./PitonFile";
import { PitonFilePartResult } from "./PitonFilePartResult";

/** Contains the result of running PitonFileResult */
export interface PitonFileResult {
    // Result Params
    parsedFile: PitonFile;

    /** Number of records this file tests */
    count: number;
    /** Number of records that fail this file's checks */
    errorCount: number;
    /** The status of the last run: success, failure, norun */
    result: string;
    /** Description summary of the run results */
    resultSummary: string;

    /** Results for all parts */
    filePartResults: PitonFilePartResult[];
}
