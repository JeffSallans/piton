// Render Results

import { Position, Range, TextDocument, TextEditor } from "vscode";
import * as fs from 'fs';
import { Dictionary, filter, flatten, get, isNull, map, values } from "lodash";
import { json2csv } from "json-2-csv";

import { PitonFile } from "../models/PitonFile";
import { PitonFileResult } from "../models/PitonFileResult";
import path from "path";

/**
 * Creates or updates result.piton.csv which contains all details of the run results
 * @param editor 
 * @param files 
 * @param fileResults 
 */
export async function updateTotalResults(workspaceRoot: string, fileResults: Dictionary<PitonFileResult | null>) {
    const fileResultsFlattened = map(flatten(map(values(fileResults), (r) => r?.filePartResults)), (r) => {
        return {
            name: r?.parsedPart.name,
            result: r?.result,
            resultSummary: r?.resultMessage,
            count: r?.resultData.length,
            errorCount: filter(r?.resultData, (d: any) => d.approved !== '1').length,
        };
    });
    createCSVFile(path.join(workspaceRoot, 'result.piton.csv'), fileResultsFlattened);
}

/**
 * Creates or updates the exception .piton.sql.csv files for all the check results from the given Piton file
 * @param editor 
 * @param file 
 * @param fileResult 
 */
export async function updateFile(editor: TextEditor, file: PitonFile, fileResult: PitonFileResult) {
    // Create Exception file
    for (const p of file.parts) {
        const result = fileResult.filePartResults[p.order];
        if (result !== undefined && result.resultData.length > 0) {
            createCSVFile(result.resultFilePath, result.resultData);
        }
    }
}

/** Writes the json object to the given file path. If a file exists, the file is overwritten */
function createCSVFile(filePath: string, data: object[]) {
    const csvString = json2csv(data, {});
    fs.writeFileSync(filePath, csvString);
}
