import { PitonFilePart } from "./PitonFilePart";

/** Contains the result of running PitonFilePart */
export interface PitonFilePartResult {
    type: string;
    /** The part that this result is from */
    parsedPart: PitonFilePart;
    queryThatRan: string;
    /** (Ran/Pass/Pass_with_exceptions/Failed) */
    result: string;
    resultMessage: string;
    /** Example: 10/30 */
    exceptions: string;
    
    lastRun: string;
 
    resultData: object[];
    confirmedExceptions: object[];
    allExceptions: object[];
}
