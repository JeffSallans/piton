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
    
    /** 
     * Possible status of running a piton file, The lower in the list will override the results.
     * Pass - Test was successful and all exceptions are 1 (approved)
     * Fail - Test failed and all exceptions are filled out and some have 0 (denied)
     * To Review - Test failed and exceptions need to be reviewed
     * No Run - Test has not ran yet
     * Skipped - Test was marked as skipped
     */
    result: string;
    /** Description summary of the run results */
    resultSummary: string;

    /** Results for all parts */
    filePartResults: PitonFilePartResult[];
}
