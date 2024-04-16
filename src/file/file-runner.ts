import { filter, map, some } from "lodash";
import { PitonFile } from "../models/PitonFile";
import { SqlDialectAdapter } from "../models/SqlDialectAdapter";
import sql from '../sql-dialects/postgres';
import { PitonFilePartResult } from "../models/PitonFilePartResult";

/**
 * 
 */
export async function runFile(file: PitonFile): PitonFilePartResult[] {
    //const sql: SqlDialectAdapter = require(`../sql-dialects/${file.sqlDialect}.ts`);

    await sql.setupConnection(file.connectionString);

    // Run count query
    file.count = await sql.countSQL(file.countQuery) || 0;

    // Run part query
    let index = -1;
    for (const part of file.parts) {
        index++;

        // Only run Check queries
        if (part.type !== 'Check') { continue; }

        let result = 'Fail';
        const resultData = await sql.querySQL(part.sanitizedQuery);
        if (part.expect === 'no_results') {
            result = (resultData.length === 0) ? 'Pass' : 'Fail';
        }
        file.parts[index].filePartResult = {
            type: part.type,
            queryThatRan: part.sanitizedQuery,
            lastRun: Date.now().toString(),
            result,
            resultData,
            resultMessage: '',
            exceptions: '',
            allExceptions: [],
            confirmedExceptions: []
        };
    }

    const checks = filter(file.parts, p => p.type === 'Check');
    file.errorCount = filter(file.parts, p => p.filePartResult?.result === 'Fail').length;
    file.result = (file.errorCount === 0) ? 'Pass' : 'Fail';
    file.resultSummary = `${checks.length - file.errorCount}/${checks.length} checks passed for ${file.count} records`;

    await sql.closeConnection();

    return map(file.parts, p => p.filePartResult).filter(res => res !== null);
}


// runFilePart(filePart: XQFilePart)


// runPreCheck(filePart: XQFilePart)

// runCount(filePart: XQFilePart)

// runOnSuccess(filePart: XQFilePart)

// runOnFailure(filePart: XQFilePart)

// runAlwaysAfter(filePart: XQFilePart)

// runCheck(filePart: XQFilePart)
