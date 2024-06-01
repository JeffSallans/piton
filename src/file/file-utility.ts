import { filter, keyBy, map, set, get, some, keys, every, sum } from "lodash";
import * as fs from 'fs';
import dayjs from "dayjs";
import { csv2json, json2csv } from "json-2-csv";

import { PitonFile } from "../models/PitonFile";
import { SqlDialectAdapter } from "../models/SqlDialectAdapter";
import postgres from '../sql-dialects/postgres';
import duckdb from '../sql-dialects/duckdb';
import oracle from '../sql-dialects/oracle';
import sqlite from '../sql-dialects/sqlite';

import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { PitonFileResult } from "../models/PitonFileResult";
import { OutputChannelLogger } from "../logging-and-debugging/OutputChannelLogger";
import { ExtensionSecretStorage } from "../logging-and-debugging/ExtensionSecretStorage";
import { PitonFilePart } from "../models/PitonFilePart";


/**
 * Modifieds result with approveCol value from the previous result 
 * @param result 
 * @param idCol 
 * @param approveCol 
 * @param prevResult 
 */
export function mergeResultWithPrevious(result: object[], idCol: string, approveCol: string, prevResult: object[]): void {
    // Filter Previous with 0 or 1 set for approve
    const prevDictionary = keyBy(prevResult, idCol);

    // Update approve column in result
    for (const r of result) {
        const prevRow = prevDictionary[get(r, idCol)];
        // If column is to be ignored update
        if (areRowsEqual(r, prevRow)) {
            set(r, approveCol, get(prevRow, approveCol, ''));
        }
        else {
            set(r, approveCol, '');
        }
    }
}

/**
 * Returns true if the new row contains all the data of the old row.
 * @param newRow 
 * @param oldRow 
 * @param ignoreCols Fields to ignore when comparing
 */
export function areRowsEqual(newRow: object, oldRow: object, ignoreCols?: string[]): boolean {
    const fields = keys(newRow);
    const allMatch = every(fields, (f) => {
        if (ignoreCols !== undefined && ignoreCols.includes(f)) { return true; }

        const fieldMatches = (get(newRow, f, '') === get(oldRow, f, ''));
        return fieldMatches;
    });
    return allMatch;
}

/** Writes the json object to the given file path. If a file exists, the file is overwritten */
export function createCSVFile(filePath: string, data: object[]) {
    const csvString = json2csv(data, {});
    fs.writeFileSync(filePath, csvString);
}
