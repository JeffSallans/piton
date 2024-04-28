import { PitonFilePart } from "./PitonFilePart";

/** Contains parsing and summary of a file */
export interface PitonFile {
    /** File name */
    name: string;
    /** Path to file */
    folderPath: string;
    sqlDialect: string;
    connectionString: string;
    connectionUser: string;

    runScheduleCron: string;
    countQuery: string;
    /** Set to true if the file should not run */
    skip: boolean;
    parts: Array<PitonFilePart>;   
}   
