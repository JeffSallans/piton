import { filter, keyBy, map, set, get, some, keys, every, sum, defaultTo } from "lodash";
import * as fs from 'fs';
import { csv2json, json2csv } from "json-2-csv";


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

        const fieldMatches = (defaultTo(get(newRow, f), '') === defaultTo(get(oldRow, f), ''));
        return fieldMatches;
    });
    return allMatch;
}

/** Writes the json object to the given file path. If a file exists, the file is overwritten */
export function createCSVFile(filePath: string, data: object[]) {
    const csvString = json2csv(data, {
        emptyFieldValue: '',
    });
    fs.writeFileSync(filePath, csvString);
}
