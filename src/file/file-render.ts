// Render Results

import { Position, Range, TextDocument, TextEditor } from "vscode";
import * as fs from 'fs';
import { Dictionary, filter, flatten, get, isNull, map, values } from "lodash";
import { json2csv } from "json-2-csv";

import { PitonFile } from "../models/PitonFile";
import { PitonFileResult } from "../models/PitonFileResult";
import path from "path";
import { PitonResultSummary } from "../models/PitonResultSummary";

/**
 * Creates or updates result.piton.csv which contains all details of the run results
 * @param editor 
 * @param files 
 * @param fileResults 
 */
export async function updateResultsSummary(workspaceRoot: string, fileResults: Dictionary<PitonFileResult | null>) {
    const fileResultsFlattened = getResultSummary(fileResults);
    createCSVFile(path.join(workspaceRoot, 'result.piton.csv'), fileResultsFlattened);
}

/**
 * Creates or updates the exception .piton.sql.csv files for all the check results from the given Piton file
 * @param editor 
 * @param file 
 * @param fileResult 
 */
export async function updateFileResults(editor: TextEditor, file: PitonFile, fileResult: PitonFileResult) {
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

/**
 * Takes the file results and creates a summary of it
 * @param fileResults The current file results
 * @returns 
 */
export function getResultSummary(fileResults: Dictionary<PitonFileResult | null>): PitonResultSummary[] {
    const fileResultsFlattened = map(flatten(map(values(fileResults), (r) => r?.filePartResults)), (r) => {
        const fileName = r?.parsedPart.fileName || '';
        const result = fileResults[fileName];
        return {
            result: r?.result || 'No Run',
            file: fileName,
            name: r?.parsedPart.name || `check-${r?.parsedPart.order || '0'}`,
            tag: r?.parsedPart.tag || '',
            resultSummary: r?.resultMessage,
            count: result?.count || 0,
            errorCount: r?.errorCount || 0,
            toBeReviewedCount: r?.toBeReviewedCount || 0
        };
    });
    return fileResultsFlattened;
}