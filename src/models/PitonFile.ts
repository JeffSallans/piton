import { PitonFilePart } from "./PitonFilePart";

/** Contains parsing and summary of a file */
export interface PitonFile {
    /** File name */
    name: string;
    /** Path to file */
    folderPath: string;
    sqlDialect: string;
    connectionString: string;
    runScheduleCron: string;
    countQuery: string;
    parts: Array<PitonFilePart>;   

    // Result Params

    /** Number of records this file tests */
    count: number;
    /** Number of records that fail this file's checks */
    errorCount: number;
    /** The status of the last run: success, failure, norun */
    result: string;
    /** Description summary of the run results */
    resultSummary: string;
}   
