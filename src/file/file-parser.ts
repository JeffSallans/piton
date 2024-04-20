import { Range, TextDocument } from "vscode";
import { PitonFile } from "../models/PitonFile";
import { PitonFilePart } from "../models/PitonFilePart";
import { map, first } from 'lodash';

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
        return parsePitonComment(block, index, text);
    });

    return {
        name: fileName,
        folderPath: filePath,
        connectionString: connectionString,
        runScheduleCron: runScheduleCron,
        sqlDialect: sqlDialect,
        parts: fileParts,

        countQuery,
    };
}

/** Split file on -- pn-check */
function getFileSplitByPitonComment(file: string): string[] {
    const sqlDialectRegex = /\s.*?(?=\-\-\s+?pn\-check.*?\r?\n)/gi;
    return file.split(sqlDialectRegex);
}

/** Takes a comment and sql underneath and pulls out query data */
function parsePitonComment(filePart: string, order: number, file: string): PitonFilePart {
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

    const checkNoNewlineRegex = /\s*?\-\-\s+?pn\-check/gi;
    const line = (getLineNumber(file, checkNoNewlineRegex)[order - 1] || { number: 0 })?.number;

    return {
        rawText: filePart,
        order,
        range: new Range(line, 0, line, 0),
        name,
        type: (isTypeCheck) ? 'Check' : 'Other',
        expect,
        expectColumn,
        expectColumnValue,
        sanitizedQuery,
    };
}

/**
 * Returns the SQL query 
 */
function parseCountQuery(filePart: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-count.*?\r?\n(?:\-\-[\w\W]*?\r?\n)*?\s*?((SELECT|WITH)[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    const query = exec[1];
    return query;
}

/**
 * Returns the SQL query 
 */
function parseCheckQuery(filePart: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-check.*?\r?\n(?:\-\-[\w\W]*?\r?\n)\s*?((SELECT|WITH)[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    const query = exec[1];
    return query;
}

function getLineNumber(str: string, re: RegExp) {
    return str.split(/(\r?\n)/).map(function (line, i) {
        if (re.test(line)) {
            return {
                line: line,
                number: i + 1,
                match: (line.match(re) || [])[0]
            };
        }
    }).filter(Boolean);
}
