import { filter, map, some } from "lodash";
import { PitonFile } from "../models/PitonFile";
import { SqlDialectAdapter } from "../models/SqlDialectAdapter";
import sql from '../sql-dialects/postgres';
import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { PitonFileResult } from "../models/PitonFileResult";
import dayjs from "dayjs";

/**
 * Execute the file and return the result
 */
export async function runFile(file: PitonFile): Promise<PitonFileResult> {
    //const sql: SqlDialectAdapter = require(`../sql-dialects/${file.sqlDialect}.ts`);

    await sql.setupConnection(file.connectionString);

    // Run count query
    const count = await sql.countSQL(file.countQuery) || 0;

    // Run part query
    let filePartResults: PitonFilePartResult[] = [];
    for (const part of file.parts) {

        // Only run Check queries
        if (part.type !== 'Check') { continue; }

        let result = 'Fail';
        const resultData = await sql.querySQL(part.sanitizedQuery);
        if (part.expect === 'no_results') {
            result = (resultData.length === 0) ? 'Pass' : 'Fail';
        }
        filePartResults.push({
            type: part.type,
            parsedPart: part,
            queryThatRan: part.sanitizedQuery,
            lastRun: dayjs(),
            result,
            resultData,
            resultMessage: '',
            exceptions: '',
            allExceptions: [],
            confirmedExceptions: []
        });
    }

    const checks = filter(file.parts, p => p.type === 'Check');
    const errorCount = filter(filePartResults, p => p.result === 'Fail').length;
    const result = (errorCount === 0) ? 'Pass' : 'Fail';
    const resultSummary = `${checks.length - errorCount}/${checks.length} checks passed for ${count} records`;

    await sql.closeConnection();

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


// runFilePart(filePart: XQFilePart)


// runPreCheck(filePart: XQFilePart)

// runCount(filePart: XQFilePart)

// runOnSuccess(filePart: XQFilePart)

// runOnFailure(filePart: XQFilePart)

// runAlwaysAfter(filePart: XQFilePart)

// runCheck(filePart: XQFilePart)
