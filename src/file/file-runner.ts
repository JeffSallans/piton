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
import { createCSVFile, mergeResultWithPrevious } from "./file-utility";

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
    else if (file.sqlDialect === 'sqlite') {
        sql = sqlite;
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

        let result = 'No Run';
        let resultData = [];
        let toBeReviewedCount = 0;
        let errorCount = 0;
        try {
            OutputChannelLogger.log(`====== QUERY =======\n${part.sanitizedQuery}`);
            resultData = await sql.querySQL(part.sanitizedQuery);
            OutputChannelLogger.logTable(resultData);
        }
        catch (e: any) {
            OutputChannelLogger.error(`====== QUERY ERROR ======\n${e?.stack || e}`, true);
            continue;
        }

        if (part.expect === 'no_results') {
            // Handle results
            mergeResultWithPrevious(resultData, part.idColumn, part.approveColumn, prevPartResultFile);

            // Determine Pass/Fail
            toBeReviewedCount = resultData.filter(r => get(r, part.approveColumn, '') === '').length; 
            errorCount = resultData.filter(r => get(r, part.approveColumn, 0) !== 1).length; 
            if (toBeReviewedCount === 0 && errorCount === 0) {
                result = 'Pass';
            } else if (toBeReviewedCount > 0) {
                result = 'To Review';
            } else {
                result = 'Fail';
            }
        } else if (part.expect === 'snapshot') {
            const snapshotResult = await handleSnapshotResult(
                csvResultPath,
                resultData,
                prevPartResultFile,
                part
            );
            result = snapshotResult.result;
            resultData = snapshotResult.resultData;
            errorCount = snapshotResult.errorCount;
            toBeReviewedCount = snapshotResult.toBeReviewedCount;
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
            errorCount,
            toBeReviewedCount
        });
    }

    const checks = filter(file.parts, p => p.type === 'Check');
    const errorCount = sum(map(filePartResults, p => p.errorCount));
    const toBeReviewedCount = sum(map(filePartResults, p => p.toBeReviewedCount));

    let result = 'No Run';
    if (toBeReviewedCount === 0 && errorCount === 0) {
        result = 'Pass';
    } else if (toBeReviewedCount > 0) {
        result = 'To Review';
    } else {
        result = 'Fail';
    }
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
 * Checks if the query result data matches the previous snapshot
 * Creates 3 CSVs: file.piton.sql.csv, file.piton.sql.snapshot.csv, and file.piton.sql.new.csv, 
 * @param csvResultPath the full path and file name for the csv
 * @param queryResultData the result to check
 * @param prevDiffResult the previous result diff
 * @param part the check meta data
 * @returns 
 */
async function handleSnapshotResult(csvResultPath: string, queryResultData: object[], prevDiffResult: object[], part: PitonFilePart):
Promise<{ resultData: object[], result: string, errorCount: number, toBeReviewedCount: number }>
{
    // Gather result data
    const changeCol = 'change';

    // If no snapshot file exists, create first file and set results to empty
    if (!fs.existsSync(part.snapshotPath)) {
        createCSVFile(part.snapshotPath, queryResultData);

        // Terminate early
        return {
            result: 'Pass',
            resultData: [],
            errorCount: 0,
            toBeReviewedCount: 0  
        };
    }

    // Save new result
    createCSVFile(part.newSnapshotPath, queryResultData);
    
    // Compare new and old, result will be saved as resultData and *.piton.sql.csv
    duckdb.setupConnection('');
    const resultData = await duckdb.querySQL(`SELECT 'removed' as ${changeCol}, * FROM '${part.snapshotPath}'
    EXCEPT
    SELECT 'removed' as ${changeCol}, * FROM '${part.newSnapshotPath}'
    UNION ALL
    SELECT 'added' as ${changeCol}, * FROM '${part.newSnapshotPath}'
    EXCEPT
    SELECT 'added' as ${changeCol}, * FROM '${part.snapshotPath}'`);
    duckdb.closeConnection();

    mergeResultWithPrevious(resultData, part.idColumn, part.approveColumn, prevDiffResult);

    // Determine Pass/Fail
    let result = 'No Run';
    const toBeReviewedCount = resultData.filter(r => get(r, part.approveColumn, '') === '').length; 
    const errorCount = resultData.filter(r => get(r, part.approveColumn, 0) !== 1).length; 
    if (toBeReviewedCount === 0 && errorCount === 0) {
        result = 'Pass';
    } else if (toBeReviewedCount > 0) {
        result = 'To Review';
    } else {
        result = 'Fail';
    }

    // If errors, leave both files

    // If no errors, delete *.snapshot.csv and rename *.new.csv to *.snapshot.csv
    if (result === 'Pass' && fs.existsSync(part.newSnapshotPath)) {
        //fs.rmSync(part.newSnapshotPath, {maxRetries: 5});
    }

    return {
        result,
        resultData,
        errorCount,
        toBeReviewedCount
    };
}



