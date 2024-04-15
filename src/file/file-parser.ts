import { TextDocument } from "vscode";
import { PitonFile } from "../models/PitonFile";
import { PitonFilePart } from "../models/PitonFilePart";
import { map } from 'lodash';

export function getFileFromDoc(file: TextDocument): PitonFile {
    const text = file.getText();
    const fileNameRegex = /^(.+?)(\/|\\)([^\\\/]+?\.piton\.sql)/gi;
    const results = fileNameRegex.exec(file.fileName) || [];
    return getFile(`${results[1]}${results[2]}`, results[3], text);
}

/** Returns */
export function getFile(filePath: string, fileName: string, text: string): PitonFile {

    // File level params
    const connectionStringRegex = /\s*?\-\-\s+?pn\-connectionString\s(.*?)\s*?\r?\n/gi;
    const connectionString = (connectionStringRegex.exec(text) || [])[1];
    const runScheduleCronRegex = /\s*?\-\-\s+?pn\-runScheduleCron\s(.*?)\s*?\r?\n/gi;
    const runScheduleCron = (runScheduleCronRegex.exec(text) || [])[1];
    const sqlDialectRegex = /\s*?\-\-\s+?pn\-sqlDialect\s(.*?)\s*?\r?\n/gi;
    const sqlDialect = (sqlDialectRegex.exec(text) || [])[1];

    // Count Query
    const countQuery = parseCountQuery(text);

    // File parts
    const fileBlocksByTokens = getFileSplitByPitonComment(text);
    const fileParts = map(fileBlocksByTokens, (block, index) => {
        return parsePitonComment(block, index);
    });

    return {
        name: fileName,
        folderPath: filePath,
        connectionString: connectionString,
        runScheduleCron: runScheduleCron,
        sqlDialect: sqlDialect,
        parts: fileParts,

        countQuery,

        count: 0,
        errorCount: 0,
        result: 'norun',
        resultSummary: ''
    };
}

/** Split file on -- pn-check */
function getFileSplitByPitonComment(file: string): string[] {
    const sqlDialectRegex = /\s.*?(?=\-\-\s+?pn\-check.*?\r?\n)/gi;
    return file.split(sqlDialectRegex);
}

/** Takes a comment and sql underneath and pulls out query data */
function parsePitonComment(filePart: string, order: number): PitonFilePart {
    const nameRegex = /\s*?\-\-\s+?pn\-name\s(.*?)\s*?\r?\n/gi;
    const name = (nameRegex.exec(filePart) || [])[1];
    const checkRegex = /\s*?\-\-\s+?pn\-check\s(.*?)\s*?\r?\n/gi;
    const isTypeCheck = (checkRegex.exec(filePart) || [])[0];
    const expectRegex = /\s*?\-\-\s+?pn\-expect\s(.*?)\s*?\r?\n/gi;
    const expect = (expectRegex.exec(filePart) || [])[1];
    const expectColumnRegex = /\s*?\-\-\s+?pn\-expectColumn\s(.*?)\s*?\r?\n/gi;
    const expectColumn = (expectColumnRegex.exec(filePart) || [])[1];
    const expectColumnValueRegex = /\s*?\-\-\s+?pn\-expectColumnValue\s(.*?)\s*?\r?\n/gi;
    const expectColumnValue = (expectColumnValueRegex.exec(filePart) || [])[1];

    const sanitizedQuery = parseCheckQuery(filePart);

    return {
        rawText: filePart,
        order,
        name,
        type: (isTypeCheck) ? 'Check' : 'Other',
        expect,
        expectColumn,
        expectColumnValue,
        sanitizedQuery,
        filePartResult: null
    };
}

/**
 * Returns the SQL query 
 */
function parseCountQuery(filePart: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-count.*?\r?\n(?:\-\-[\w\W]*?\r?\n)*?\s*?(SELECT[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    const query = exec[1];
    return query;
}

/**
 * Returns the SQL query 
 */
function parseCheckQuery(filePart: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-check.*?\r?\n(?:\-\-[\w\W]*?\r?\n)\s*?(SELECT[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    const query = exec[1];
    return query;
}
