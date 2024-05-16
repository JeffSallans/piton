import { Dayjs } from "dayjs";
import { PitonFilePart } from "./PitonFilePart";

/** Contains the result of running PitonFilePart */
export interface PitonFilePartResult {
    type: string;

    /** The part that this result is from */
    parsedPart: PitonFilePart;

    /** Tracking */
    queryThatRan: string;

    /** 
     * Possible status of running a piton file part
     * Pass - Test was successful and all exceptions are 1 (approved)
     * Fail - Test failed and all exceptions are filled out and some have 0 (denied)
     * To Review - Test failed and exceptions need to be reviewed
     * No Run - Test has not ran yet
     * Skipped - Test was marked as skipped
     */
    result: string;
    resultMessage: string;

    /** Absolute path to the result file */
    resultFilePath: string;

    /** Example: 10/30 */
    exceptions: string;
    
    lastRun: Dayjs;
 
    /** The result */
    resultData: object[];
    
    /** Number of tests with errors */
    errorCount: number;

    /** Number of tests with unreviewed exceptions */
    toBeReviewedCount: number;
}
