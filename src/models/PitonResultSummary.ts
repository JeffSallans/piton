import { PitonFile } from "./PitonFile";
import { PitonFilePartResult } from "./PitonFilePartResult";

/** A summary of all piton results */
export interface PitonResultSummary {
    /** Number of total tests */
    count: number;

    /** Number of tests with erros */
    errorCount: number;

    /** Number of tests with exceptions */
    exceptionCount: number;
}
