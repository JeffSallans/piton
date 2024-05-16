import { PitonFile } from "./PitonFile";
import { PitonFilePartResult } from "./PitonFilePartResult";

/** A summary of all piton results */
export interface PitonResultSummary {

    /** Result status Pass, Fail, No Run, Skipped, or To Review */
    result: string;

    /** Name of the file */
    file: string;

    /** Name of the check */
    name: string;

    /** Name of the tag for the given check, to help group results */
    tag: string;

    /** Total count for the file */
    count: number;

    /** Number of tests with errors */
    errorCount: number;

    /** Number of tests with unreviewed exceptions */
    toBeReviewedCount: number;

}
