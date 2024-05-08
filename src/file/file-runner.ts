import { filter, keyBy, map, set, get, some, keys, every } from "lodash";
import * as fs from 'fs';
import dayjs from "dayjs";
import { csv2json } from "json-2-csv";

import { PitonFile } from "../models/PitonFile";
import { SqlDialectAdapter } from "../models/SqlDialectAdapter";
import postgres from '../sql-dialects/postgres';
import duckdb from '../sql-dialects/duckdb';
import oracle from '../sql-dialects/oracle';

import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { PitonFileResult } from "../models/PitonFileResult";
import { OutputChannelLogger } from "../logging-and-debugging/OutputChannelLogger";
import { ExtensionSecretStorage } from "../logging-and-debugging/ExtensionSecretStorage";

/**
 * Execute the file and return the result
 * @param file The Piton configuration to run
 * @returns Result for the given file
 */
export async function runFile(file: PitonFile): Promise<PitonFileResult> {
    OutputChannelLogger.log(`====== RUNNING FILE =======\n${file?.name}`);
    
    // Skip if noted
    if (file === undefined || file.skip || !file.sqlDialect) { 
        OutputChannelLogger.log(`====== SKIPPING FILE =======\n${file?.name}`);
        return {
            result: 'Skipped',
            count: 0,
            errorCount: 0,
            resultSummary: '',
            parsedFile: file,
            filePartResults: []
        };
    }

    let sql: SqlDialectAdapter = duckdb;
    if (file.sqlDialect === 'postgres') {
        sql = postgres;
    }
    else if (file.sqlDialect === 'oracledb') {
        sql = oracle;
    }

    try {
        const connectionPassword = await ExtensionSecretStorage.secretStorage.get(`${file.connectionString}`) || '';
        const sensitiveConnectionString = `${file?.connectionString}`.replace('pn-password', connectionPassword); 
        await sql.setupConnection(sensitiveConnectionString);
    }
    catch (e: any) {
        OutputChannelLogger.error(`====== CONNECTION ERROR ======\n${e?.stack || e}`, true);
        throw e;
    }

    // Run count query
    let count;
    try {
        OutputChannelLogger.log(`====== COUNT QUERY =======\n${file.countQuery}`);
        count = await sql.countSQL(file.countQuery) || 0;
        OutputChannelLogger.log(`====== COUNT RESULT =======\n${count}`);
    }
    catch (e: any) {
        OutputChannelLogger.error(`====== QUERY ERROR ======\n${e?.stack || e}`, true);
        throw e;
    }

    // Run part query
    let filePartResults: PitonFilePartResult[] = [];
    for (const part of file.parts) {

        // Only run Check queries
        if (part.type !== 'Check') { continue; }

        // Skip if noted
        if (part.skip) { continue; }

        const csvResultPath = `${file.folderPath}${file.name}.${part.name || 'check'}${part.order}.csv`;

        // Get existing result if exists
        let prevPartResultFile: object[] = [];
        try {
            if (fs.existsSync(csvResultPath)) {
                const fileString = fs.readFileSync(csvResultPath).toString();
                prevPartResultFile = csv2json(fileString);
            }
        }
        catch (e: any) {
            OutputChannelLogger.error(`====== PREV CSV PARSE ERROR ======\n${e?.stack || e}`, true);
        }

        let result = 'Fail';
        let resultData = [];
        try {
            OutputChannelLogger.log(`====== QUERY =======\n${part.sanitizedQuery}`);
            resultData = await sql.querySQL(part.sanitizedQuery);
            OutputChannelLogger.logTable(resultData);
        }
        catch (e: any) {
            OutputChannelLogger.error(`====== QUERY ERROR ======\n${e?.stack || e}`, true);
            continue;
        }

        mergeResultWithPrevious(resultData, part.idColumn, part.approveColumn, prevPartResultFile);

        if (part.expect === 'no_results') {
            const failedRows = resultData.filter(r => get(r, part.approveColumn, 0) !== 1).length; 
            result = (failedRows === 0) ? 'Pass' : 'Fail';
        }

        filePartResults.push({
            type: part.type,
            parsedPart: part,
            queryThatRan: part.sanitizedQuery,
            lastRun: dayjs(),
            result,
            resultData,
            resultMessage: '',
            resultFilePath: csvResultPath,
            exceptions: '',
            allExceptions: [],
            confirmedExceptions: []
        });
    }

    const checks = filter(file.parts, p => p.type === 'Check');
    const errorCount = filter(filePartResults, p => p.result === 'Fail').length;
    const result = (errorCount === 0) ? 'Pass' : 'Fail';
    const resultSummary = `${checks.length - errorCount}/${checks.length} checks passed for ${count} records`;

    try {
        await sql.closeConnection();
    }
    catch (e) {
        OutputChannelLogger.error(`====== CLOSING CONN ERROR ======\n${e}`, true);
    }

    const fileResult: PitonFileResult = {
        parsedFile: file,
        count,
        errorCount,
        result,
        resultSummary,
        filePartResults
    };

    return fileResult;
}

/**
 * Modifieds result with approveCol value from the previous result 
 * @param result 
 * @param idCol 
 * @param approveCol 
 * @param prevResult 
 */
function mergeResultWithPrevious(result: object[], idCol: string, approveCol: string, prevResult: object[]): void {
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
function areRowsEqual(newRow: object, oldRow: object, ignoreCols?: string[]): boolean {
    const fields = keys(newRow);
    const allMatch = every(fields, (f) => {
        if (ignoreCols !== undefined && ignoreCols.includes(f)) { return true; }

        const fieldMatches = (get(newRow, f, '') === get(oldRow, f, ''));
        return fieldMatches;
    });
    return allMatch;
}

