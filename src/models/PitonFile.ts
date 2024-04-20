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
}   
